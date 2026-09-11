import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { createClient } from "../controllers/client.controller.js";
import { UserRole } from "../generated/prisma/enums.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorize(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  createClient,
);

export default router;
