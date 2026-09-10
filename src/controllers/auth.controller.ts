import type { Request, Response } from "express";
import prisma from "../db/prisma.js";
import z from "zod";
import RegisterSchema from "../schemas/auth/register.schema.js";
import raiseZodErrors from "../helpers/raise-zod-error.js";
import raiseServerError from "../helpers/raise-server-error.js";
import bcrypt from "bcrypt";
import LoginSchema from "../schemas/auth/login.schema.js";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE, REFRESH_COOKIE } from "../constants/index.js";

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

export const userLogin = async (req: Request, res: Response) => {
  try {
    const rawData = req.body;

    const result = z.safeParse(LoginSchema, rawData);

    if (!result.success || !result.data) {
      return raiseZodErrors(result.error, res);
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "7d",
      },
    );

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    raiseServerError(res, error);
  }
};
