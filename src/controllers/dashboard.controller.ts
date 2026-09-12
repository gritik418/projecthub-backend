import type { Request, Response } from "express";
import raiseServerError from "../helpers/raise-server-error.js";
import { UserRole } from "../generated/prisma/enums.js";
import prisma from "../db/prisma.js";

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;
    const userRole: UserRole | undefined = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (userRole === UserRole.ADMIN) {
      const [
        totalProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueTasks,
      ] = await Promise.all([
        prisma.project.count(),

        prisma.task.count(),

        prisma.task.count({
          where: {
            status: "TODO",
          },
        }),

        prisma.task.count({
          where: {
            status: "IN_PROGRESS",
          },
        }),

        prisma.task.count({
          where: {
            status: "IN_REVIEW",
          },
        }),

        prisma.task.count({
          where: {
            status: "DONE",
          },
        }),

        prisma.task.count({
          where: {
            isOverdue: true,
            NOT: {
              status: "DONE",
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Dashboard analytics fetched successfully.",
        data: {
          totalProjects,
          totalTasks,
          tasksByStatus: {
            todo: todoTasks,
            inProgress: inProgressTasks,
            inReview: inReviewTasks,
            done: doneTasks,
          },
          overdueTasks,
        },
      });
    }

    if (userRole === UserRole.PROJECT_MANAGER) {
      const [
        totalProjects,
        activeProjects,
        completedProjects,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        upcomingDueTasks,
      ] = await Promise.all([
        prisma.project.count({
          where: {
            createdById: userId,
          },
        }),

        prisma.project.count({
          where: {
            createdById: userId,
            tasks: {
              some: {
                NOT: {
                  status: "DONE",
                },
              },
            },
          },
        }),

        prisma.project.count({
          where: {
            createdById: userId,
            tasks: {
              every: {
                status: "DONE",
              },
            },
          },
        }),

        prisma.task.count({
          where: {
            project: {
              createdById: userId,
            },
            status: "TODO",
          },
        }),

        prisma.task.count({
          where: {
            project: {
              createdById: userId,
            },
            status: "IN_PROGRESS",
          },
        }),

        prisma.task.count({
          where: {
            project: {
              createdById: userId,
            },
            status: "IN_REVIEW",
          },
        }),

        prisma.task.count({
          where: {
            project: {
              createdById: userId,
            },
            status: "DONE",
          },
        }),

        prisma.task.findMany({
          where: {
            project: {
              createdById: userId,
            },

            dueDate: {
              gte: getStartOfWeek(),
              lt: getStartOfNextWeek(),
            },

            NOT: {
              status: "DONE",
            },
          },

          orderBy: {
            dueDate: "asc",
          },

          take: 10,

          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,

            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Dashboard analytics fetched successfully.",
        data: {
          projects: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects,
          },

          tasks: {
            total: todoTasks + inProgressTasks + inReviewTasks + doneTasks,

            todo: todoTasks,
            inProgress: inProgressTasks,
            inReview: inReviewTasks,
            done: doneTasks,
          },

          upcomingDueTasks,
        },
      });
    }

    if (userRole === UserRole.DEVELOPER) {
      const assignedTasks = await prisma.task.findMany({
        where: {
          assignedDeveloperId: userId,
        },

        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,

          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Dashboard analytics fetched successfully.",
        data: {
          assignedTasks,
        },
      });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to view dashboard analytics.",
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

const getStartOfWeek = () => {
  const date = new Date();

  const day = date.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);

  return date;
};

const getStartOfNextWeek = () => {
  const date = getStartOfWeek();

  date.setDate(date.getDate() + 7);

  return date;
};
