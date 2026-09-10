import type { Request, Response } from "express";
import raiseServerError from "../helpers/raise-server-error.js";
import prisma from "../db/prisma.js";

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
