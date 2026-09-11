import type { Request, Response } from "express";
import raiseServerError from "../helpers/raise-server-error.js";
import z from "zod";
import CreateProjectSchema from "../schemas/project/create-project.schema.js";
import raiseZodError from "../helpers/raise-zod-error.js";
import prisma from "../db/prisma.js";

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    const rawData = req.body;

    const result = z.safeParse(CreateProjectSchema, rawData);

    if (!result.success) {
      return raiseZodError(result.error, res);
    }

    const { clientId, name, description } = result.data;

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? "",
        clientId,
        createdById: userId,
        createdAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
