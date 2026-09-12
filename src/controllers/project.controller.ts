import type { Request, Response } from "express";
import raiseServerError from "../helpers/raise-server-error.js";
import z from "zod";
import CreateProjectSchema from "../schemas/project/create-project.schema.js";
import raiseZodError from "../helpers/raise-zod-error.js";
import prisma from "../db/prisma.js";
import { UserRole } from "../generated/prisma/enums.js";
import type { ActivityLog, Project } from "../generated/prisma/client.js";

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

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;
    const userRole: UserRole | undefined = req.user?.role;

    if (!userId || !userRole)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    let projects: Project[] = [];

    if (userRole === UserRole.ADMIN) {
      projects = await prisma.project.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    } else if (userRole === UserRole.PROJECT_MANAGER) {
      projects = await prisma.project.findMany({
        where: {
          createdById: userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          tasks: {
            some: {
              assignedDeveloperId: userId,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully.",
      data: {
        projects,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;
    const userRole: UserRole | undefined = req.user?.role;

    const projectId = req.params?.projectId;

    if (!userId || !userRole)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    let project: Project | null = null;

    if (userRole === UserRole.ADMIN) {
      project = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          tasks: {
            include: {
              activities: true,
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              project: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              dueDate: "asc",
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    } else if (userRole === UserRole.PROJECT_MANAGER) {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          createdById: userId,
        },
        include: {
          tasks: {
            include: {
              activities: true,
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              project: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              dueDate: "asc",
            },
          },

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          client: true,
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });
    } else {
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          tasks: {
            some: {
              assignedDeveloperId: userId,
            },
          },
        },
        include: {
          tasks: {
            where: {
              assignedDeveloperId: userId,
            },
            include: {
              activities: true,
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              project: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              dueDate: "asc",
            },
          },
          _count: {
            select: {
              tasks: {
                where: {
                  assignedDeveloperId: userId,
                },
              },
            },
          },
        },
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project fetched successfully.",
      data: {
        project,
      },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};

export const getProjectActivity = async (req: Request, res: Response) => {
  try {
    const userId: string | undefined = req.user?.id;
    const userRole: UserRole | undefined = req.user?.role;

    const projectId = req.params?.projectId;

    if (!userId || !userRole)
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    let project: Project | null = null;

    if (UserRole.ADMIN) {
      project = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });
    } else if (UserRole.PROJECT_MANAGER) {
      project = await prisma.project.findUnique({
        where: {
          id: projectId,
          createdById: userId,
        },
      });
    } else {
      project = await prisma.project.findUnique({
        where: {
          id: projectId,
          tasks: {
            some: {
              assignedDeveloperId: userId,
            },
          },
        },
      });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you don't have access.",
      });
    }

    let activities: ActivityLog[] = [];

    if (UserRole.ADMIN || UserRole.PROJECT_MANAGER) {
      activities = await prisma.activityLog.findMany({
        where: {
          task: {
            projectId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      activities = await prisma.activityLog.findMany({
        where: {
          task: {
            projectId,
            assignedDeveloperId: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              assignedDeveloper: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully.",
      data: { activities },
    });
  } catch (error) {
    return raiseServerError(res, error);
  }
};
