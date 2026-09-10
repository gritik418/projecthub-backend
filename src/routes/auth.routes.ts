import { Router } from "express";
import {
  refreshAccessToken,
  userLogin,
  userRegister,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", userRegister);

router.post("/login", userLogin);

router.post("/refresh", refreshAccessToken);

export default router;
