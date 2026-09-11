import type { Request, Response } from "express";
import z from "zod";
import prisma from "../db/prisma.js";
import raiseServerError from "../helpers/raise-server-error.js";
import raiseZodError from "../helpers/raise-zod-error.js";
import CreateClientSchema from "../schemas/client/create-client.schema.js";

export const createClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    const rawData = req.body;

    const result = z.safeParse(CreateClientSchema, rawData);

    if (!result.success) {
      return raiseZodError(result.error, res);
    }

    const { name, company, email } = result.data;

    const existingEmail = await prisma.client.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Client with this email already exists.",
      });
    }

    await prisma.client.create({
      data: {
        name,
        email,
        company: company ?? "",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully.",
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    const clients = await prisma.client.findMany();

    return res.status(200).json({
      success: true,
      message: "Clients fetched successfully.",
      data: { clients },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
