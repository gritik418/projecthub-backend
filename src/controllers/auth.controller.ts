import type { Request, Response } from "express";
import prisma from "../db/prisma.js";
import z from "zod";
import RegisterSchema from "../schemas/auth/register.schema.js";
import raiseZodErrors from "../helpers/raise-zod-error.js";
import raiseServerError from "../helpers/raise-server-error.js";
import bcrypt from "bcrypt";

export const userRegister = async (req: Request, res: Response) => {
  try {
    const rawData = req.body;

    const result = z.safeParse(RegisterSchema, rawData);

    if (!result.success || !result.data) {
      return raiseZodErrors(result.error, res);
    }

    const { email, name, password, role } = result.data;

    const existingEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (error) {
    raiseServerError(res, error);
  }
};
