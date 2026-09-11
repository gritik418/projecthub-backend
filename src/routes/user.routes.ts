import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { UserRole } from "../generated/prisma/enums.js";
import { getDevelopers } from "../controllers/user.controller.js";

const router = Router();

router.get(
  "/developers",
  authMiddleware,
  authorize(UserRole.ADMIN, UserRole.PROJECT_MANAGER),
  getDevelopers,
);

export default router;
