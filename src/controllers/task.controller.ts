import type { Request, Response } from "express";
import z from "zod";

import raiseServerError from "../helpers/raise-server-error.js";
import raiseZodError from "../helpers/raise-zod-error.js";

import CreateTaskSchema from "../schemas/task/create-task.schema.js";
import { UserRole } from "../generated/prisma/enums.js";
import prisma from "../db/prisma.js";

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

    const task = await prisma.task.create({
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

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
