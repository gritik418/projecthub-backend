import type { Request, Response } from "express";
import prisma from "../db/prisma.js";

export const userRegister = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    return res.json({
      data,
    });
  } catch (error) {}
};
