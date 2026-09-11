import { Router } from "express";
import {
  getMe,
  refreshAccessToken,
  userLogin,
  userRegister,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", userRegister);

router.post("/login", userLogin);

router.post("/refresh", refreshAccessToken);

router.get("/me", authMiddleware, getMe);

export default router;
