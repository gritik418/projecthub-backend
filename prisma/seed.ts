import bcrypt from "bcrypt";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const password = await bcrypt.hash("Password@123", 10);

async function main() {
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@projecthub.com",
      password,
      role: "ADMIN",
    },
  });

  const projectManager1 = await prisma.user.create({
    data: {
      name: "John Manager",
      email: "john.manager@projecthub.com",
      password,
      role: "PROJECT_MANAGER",
    },
  });

  const projectManager2 = await prisma.user.create({
    data: {
      name: "Sarah Manager",
      email: "sarah.manager@projecthub.com",
      password,
      role: "PROJECT_MANAGER",
    },
  });

  const developers = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Developer",
        email: "alex.dev@projecthub.com",
        password,
        role: "DEVELOPER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Mike Developer",
        email: "mike.dev@projecthub.com",
        password,
        role: "DEVELOPER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Emma Developer",
        email: "emma.dev@projecthub.com",
        password,
        role: "DEVELOPER",
      },
    }),
    prisma.user.create({
      data: {
        name: "David Developer",
        email: "david.dev@projecthub.com",
        password,
        role: "DEVELOPER",
      },
    }),
  ]);

  const [alex, mike, emma, david] = developers;

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "TechCorp Solutions",
        email: "contact@techcorp.com",
        company: "TechCorp",
      },
    }),
    prisma.client.create({
      data: {
        name: "Nova Digital",
        email: "hello@novadigital.com",
        company: "Nova Digital",
      },
    }),
    prisma.client.create({
      data: {
        name: "Acme Industries",
        email: "contact@acmeindustries.com",
        company: "Acme Industries",
      },
    }),
  ]);

  const [techCorp, novaDigital, acme] = clients;

  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description:
        "Development of a modern e-commerce platform with product management, checkout and order tracking.",
      clientId: techCorp.id,
      createdById: projectManager1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile Banking Dashboard",
      description:
        "A secure banking dashboard for customers to manage accounts, transactions and payments.",
      clientId: novaDigital.id,
      createdById: projectManager1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Healthcare Management System",
      description:
        "Healthcare platform for managing patients, appointments and medical records.",
      clientId: acme.id,
      createdById: projectManager2.id,
    },
  });

  const now = new Date();

  const overdueDate1 = new Date(now);
  overdueDate1.setDate(overdueDate1.getDate() - 7);

  const overdueDate2 = new Date(now);
  overdueDate2.setDate(overdueDate2.getDate() - 3);

  const futureDate1 = new Date(now);
  futureDate1.setDate(futureDate1.getDate() + 2);

  const futureDate2 = new Date(now);
  futureDate2.setDate(futureDate2.getDate() + 4);

  const futureDate3 = new Date(now);
  futureDate3.setDate(futureDate3.getDate() + 6);

  const futureDate4 = new Date(now);
  futureDate4.setDate(futureDate4.getDate() + 10);

  const tasks = await prisma.task.createMany({
    data: [
      {
        title: "Design product listing page",
        description: "Create responsive product listing UI.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        isOverdue: false,
        projectId: project1.id,
        assignedDeveloperId: alex.id,
      },
      {
        title: "Implement product API",
        description: "Build product CRUD APIs.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: futureDate1,
        isOverdue: false,
        projectId: project1.id,
        assignedDeveloperId: mike.id,
      },
      {
        title: "Implement shopping cart",
        description: "Implement cart functionality and persistence.",
        status: "IN_REVIEW",
        priority: "HIGH",
        dueDate: futureDate2,
        isOverdue: false,
        projectId: project1.id,
        assignedDeveloperId: emma.id,
      },
      {
        title: "Integrate payment gateway",
        description: "Integrate payment provider.",
        status: "TODO",
        priority: "CRITICAL",
        dueDate: futureDate3,
        isOverdue: false,
        projectId: project1.id,
        assignedDeveloperId: david.id,
      },
      {
        title: "Fix checkout validation",
        description: "Fix checkout form validation issues.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: overdueDate1,
        isOverdue: true,
        projectId: project1.id,
        assignedDeveloperId: alex.id,
      },

      {
        title: "Build account overview",
        description: "Create customer account dashboard.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        isOverdue: false,
        projectId: project2.id,
        assignedDeveloperId: mike.id,
      },
      {
        title: "Implement transaction history",
        description: "Create transaction history API and UI.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: futureDate1,
        isOverdue: false,
        projectId: project2.id,
        assignedDeveloperId: emma.id,
      },
      {
        title: "Add money transfer flow",
        description: "Implement secure money transfer flow.",
        status: "IN_REVIEW",
        priority: "CRITICAL",
        dueDate: futureDate3,
        isOverdue: false,
        projectId: project2.id,
        assignedDeveloperId: david.id,
      },
      {
        title: "Implement payment notifications",
        description: "Add real-time transaction notifications.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: futureDate4,
        isOverdue: false,
        projectId: project2.id,
        assignedDeveloperId: alex.id,
      },
      {
        title: "Fix transaction filtering",
        description: "Fix date and status filtering.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: overdueDate2,
        isOverdue: true,
        projectId: project2.id,
        assignedDeveloperId: mike.id,
      },

      {
        title: "Create patient registration",
        description: "Build patient registration workflow.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        isOverdue: false,
        projectId: project3.id,
        assignedDeveloperId: emma.id,
      },
      {
        title: "Implement appointment scheduling",
        description: "Build appointment scheduling functionality.",
        status: "IN_PROGRESS",
        priority: "CRITICAL",
        dueDate: futureDate2,
        isOverdue: false,
        projectId: project3.id,
        assignedDeveloperId: david.id,
      },
      {
        title: "Build medical records module",
        description: "Create medical record management.",
        status: "IN_REVIEW",
        priority: "HIGH",
        dueDate: futureDate3,
        isOverdue: false,
        projectId: project3.id,
        assignedDeveloperId: alex.id,
      },
      {
        title: "Add doctor dashboard",
        description: "Create dashboard for doctors.",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: futureDate4,
        isOverdue: false,
        projectId: project3.id,
        assignedDeveloperId: mike.id,
      },
      {
        title: "Add patient notifications",
        description: "Implement appointment and prescription notifications.",
        status: "TODO",
        priority: "LOW",
        dueDate: futureDate4,
        isOverdue: false,
        projectId: project3.id,
        assignedDeveloperId: emma.id,
      },
    ],
  });

  const createdTasks = await prisma.task.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        taskId: createdTasks[0]!.id,
        userId: alex.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "DONE",
      },
      {
        taskId: createdTasks[1]!.id,
        userId: mike.id,
        type: "STATUS_CHANGED",
        oldStatus: "TODO",
        newStatus: "IN_PROGRESS",
      },
      {
        taskId: createdTasks[2]!.id,
        userId: emma.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "IN_REVIEW",
      },
      {
        taskId: createdTasks[5]!.id,
        userId: mike.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "DONE",
      },
      {
        taskId: createdTasks[6]!.id,
        userId: emma.id,
        type: "STATUS_CHANGED",
        oldStatus: "TODO",
        newStatus: "IN_PROGRESS",
      },
      {
        taskId: createdTasks[7]!.id,
        userId: david.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "IN_REVIEW",
      },
      {
        taskId: createdTasks[10]!.id,
        userId: emma.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "DONE",
      },
      {
        taskId: createdTasks[11]!.id,
        userId: david.id,
        type: "STATUS_CHANGED",
        oldStatus: "TODO",
        newStatus: "IN_PROGRESS",
      },
      {
        taskId: createdTasks[12]!.id,
        userId: alex.id,
        type: "STATUS_CHANGED",
        oldStatus: "IN_PROGRESS",
        newStatus: "IN_REVIEW",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: 'You have been assigned the task "Implement product API".',
        userId: mike.id,
        taskId: createdTasks[1]!.id,
        isRead: false,
      },
      {
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: 'You have been assigned the task "Implement shopping cart".',
        userId: emma.id,
        taskId: createdTasks[2]!.id,
        isRead: true,
      },
      {
        type: "TASK_MOVED_TO_REVIEW",
        title: "Task moved to review",
        message:
          'The task "Implement shopping cart" has been moved to In Review.',
        userId: projectManager1.id,
        taskId: createdTasks[2]!.id,
        isRead: false,
      },
      {
        type: "TASK_MOVED_TO_REVIEW",
        title: "Task moved to review",
        message:
          'The task "Add money transfer flow" has been moved to In Review.',
        userId: projectManager1.id,
        taskId: createdTasks[7]!.id,
        isRead: true,
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log("");
  console.log("Users:");
  console.log("Admin: admin@projecthub.com");
  console.log("PM 1: john.manager@projecthub.com");
  console.log("PM 2: sarah.manager@projecthub.com");
  console.log("Developer 1: alex.dev@projecthub.com");
  console.log("Developer 2: mike.dev@projecthub.com");
  console.log("Developer 3: emma.dev@projecthub.com");
  console.log("Developer 4: david.dev@projecthub.com");
  console.log("");
  console.log("Password for all users: Password@123");
  console.log("");
  console.log("Projects: 3");
  console.log("Tasks: 15");
  console.log("Overdue tasks: 2");
  console.log("Activity logs: 9");
  console.log("Notifications: 4");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
