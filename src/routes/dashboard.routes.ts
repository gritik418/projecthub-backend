import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getDashboardAnalytics } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/analytics", authMiddleware, getDashboardAnalytics);

export default router;
