import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma/enums.js";
import raiseServerError from "../helpers/raise-server-error.js";

const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
        });
      }

      next();
    } catch (error) {
      return raiseServerError(res, error);
    }
  };

export default authorize;
