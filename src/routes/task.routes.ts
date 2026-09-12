import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { UserRole } from "../generated/prisma/enums.js";
import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "../controllers/task.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorize(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  createTask,
);

router.get("/", authMiddleware, getTasks);

router.patch("/:taskId/status", authMiddleware, updateTaskStatus);

export default router;
