import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { UserRole } from "../generated/prisma/enums.js";
import { createProject } from "../controllers/project.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorize(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  createProject,
);

export default router;
