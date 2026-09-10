import { Router } from "express";
import { userRegister } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", userRegister);

export default router;
