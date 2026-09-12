import type { Request, Response } from "express";
import z from "zod";

import raiseServerError from "../helpers/raise-server-error.js";
import raiseZodError from "../helpers/raise-zod-error.js";

import CreateTaskSchema from "../schemas/task/create-task.schema.js";
import {
  TaskPriority,
  TaskStatus,
  UserRole,
} from "../generated/prisma/enums.js";
import prisma from "../db/prisma.js";
import UpdateTaskStatusSchema from "../schemas/task/update-task-status.schema.js";
import type { Task } from "../generated/prisma/client.js";
import { ConnectedUsers, io } from "../socket/socket.server.js";

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.PROJECT_MANAGER) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create tasks.",
      });
    }

    const result = z.safeParse(CreateTaskSchema, req.body);

    if (!result.success) {
      return raiseZodError(result.error, res);
    }

    const {
      title,
      description,
      status,
      priority,
      projectId,
      dueDate,
      assignedDeveloperId,
    } = result.data;

    const developer = await prisma.user.findUnique({
      where: {
        id: assignedDeveloperId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found.",
      });
    }

    if (developer.role !== UserRole.DEVELOPER) {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a developer.",
      });
    }

    const project =
      userRole === UserRole.ADMIN
        ? await prisma.project.findUnique({
            where: {
              id: projectId,
            },
          })
        : await prisma.project.findFirst({
            where: {
              id: projectId,
              createdById: userId,
            },
          });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have access.",
      });
    }

    const { task, notification } = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          description: description ?? "",
          dueDate: new Date(dueDate),
          status,
          priority,
          assignedDeveloperId,
          projectId,
        },
      });

      const notification = await tx.notification.create({
        data: {
          type: "TASK_ASSIGNED",
          title: "New task assigned",
          message: `You have been assigned the task "${task.title}".`,
          userId: assignedDeveloperId,
          taskId: task.id,
          isRead: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return { task, notification };
    });

    const developerSocket = ConnectedUsers.get(assignedDeveloperId);

    if (developerSocket) {
      developerSocket.emit("new-notification", notification);
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { status, priority, dueFrom, dueTo } = req.query;

    const where: any = {};

    if (typeof status === "string") {
      if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }

      where.status = status;
    }

    if (typeof priority === "string") {
      if (!Object.values(TaskPriority).includes(priority as TaskPriority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }

      where.priority = priority;
    }

    if (dueFrom || dueTo) {
      where.dueDate = {};

      if (typeof dueFrom === "string") {
        const fromDate = new Date(dueFrom);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid dueFrom date.",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        where.dueDate.gte = fromDate;
      }

      if (typeof dueTo === "string") {
        const toDate = new Date(dueTo);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid dueTo date.",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        where.dueDate.lte = toDate;
      }
    }

    if (userRole === UserRole.PROJECT_MANAGER) {
      where.project = {
        createdById: userId,
      };
    } else if (userRole === UserRole.DEVELOPER) {
      where.assignedDeveloperId = userId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully.",
      data: {
        tasks,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const taskId = req.params?.taskId;

    const rawData = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!taskId || typeof taskId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Task ID is required.",
      });
    }

    const result = z.safeParse(UpdateTaskStatusSchema, rawData);

    if (!result.success) {
      return raiseZodError(result.error, res);
    }

    const { status } = result.data;

    let task: Task | null = null;

    if (userRole === UserRole.DEVELOPER) {
      task = await prisma.task.findUnique({
        where: {
          id: taskId,
          assignedDeveloperId: userId,
        },
        include: {
          project: {
            select: {
              id: true,
              createdById: true,
            },
          },
        },
      });
    } else if (userRole === UserRole.PROJECT_MANAGER) {
      task = await prisma.task.findUnique({
        where: {
          id: taskId,
          project: {
            createdById: userId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              createdById: true,
            },
          },
        },
      });
    } else {
      task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          project: {
            select: {
              id: true,
              createdById: true,
            },
          },
        },
      });
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have permission.",
      });
    }

    if (task.status === "DONE") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status if done.",
      });
    }

    const { activity, updatedTask, notification } = await prisma.$transaction(
      async (tx) => {
        const updatedTask = await tx.task.update({
          where: {
            id: taskId,
          },
          data: {
            status,
          },
          include: {
            project: {
              select: {
                createdById: true,
              },
            },
          },
        });

        const activity = await tx.activityLog.create({
          data: {
            type: "STATUS_CHANGED",
            newStatus: status,
            oldStatus: task.status,
            taskId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            task: {
              select: {
                id: true,
                title: true,
                assignedDeveloper: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

        const notification = await tx.notification.create({
          data: {
            type: "TASK_MOVED_TO_REVIEW",
            title: "Task moved to review.",
            message: `The task "${task.title}" has been moved to In Review.`,
            userId: updatedTask.project.createdById,
            taskId: task.id,
            isRead: false,
          },
        });

        return {
          updatedTask,
          activity,
          notification,
        };
      },
    );

    io.to(`project:${task.projectId}`).emit("task-status-updated", {
      taskId: updatedTask.id,
      projectId: task.projectId,
      status: updatedTask.status,
      activity: activity,
    });

    const pmSocket = ConnectedUsers.get(updatedTask.project.createdById);

    if (pmSocket) {
      io.to(pmSocket.id).emit("new-notification", notification);
    }

    return res.status(200).json({
      success: false,
      message: "Task status updated successfully.",
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
