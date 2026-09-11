import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import raiseServerError from "../helpers/raise-server-error.js";
import type { UserRole } from "../generated/prisma/enums.js";

export interface JWT_Payload {
  id: string;
  email: string;
  role: UserRole;
}

declare module "express" {
  interface Request {
    user?: JWT_Payload;
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Access token expired. Please login again.",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    return raiseServerError(res, error);
  }
};

export default authMiddleware;
