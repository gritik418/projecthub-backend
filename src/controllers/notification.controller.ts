import type { Request, Response } from "express";
import prisma from "../db/prisma.js";
import raiseServerError from "../helpers/raise-server-error.js";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isRead: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      data: {
        notifications,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
