import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getNotifications } from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);

export default router;
