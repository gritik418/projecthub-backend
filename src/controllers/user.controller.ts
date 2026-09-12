import type { Request, Response } from "express";
import raiseServerError from "../helpers/raise-server-error.js";
import { UserRole } from "../generated/prisma/enums.js";
import prisma from "../db/prisma.js";

export const getDevelopers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    if (userRole !== UserRole.ADMIN && userRole !== UserRole.PROJECT_MANAGER) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to list developers.",
      });
    }

    const developers = await prisma.user.findMany({
      where: {
        role: UserRole.DEVELOPER,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Developers fetched successfully.",
      data: { developers },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    if (userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to list users.",
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            assignedTasks: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: {
        users,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
