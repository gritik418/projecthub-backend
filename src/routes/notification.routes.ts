import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);

router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

export default router;
