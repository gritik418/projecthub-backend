import { Worker } from "bullmq";
import redis from "../config/redis.js";
import prisma from "../db/prisma.js";

export const taskWorker = new Worker(
  "task",
  async (job) => {
    if (job.name !== "check-overdue-tasks") {
      return;
    }

    const result = await prisma.task.updateMany({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          not: "DONE",
        },
        isOverdue: false,
      },
      data: {
        isOverdue: true,
      },
    });

    console.log(`${result.count} tasks marked as overdue.`);
  },
  {
    connection: redis,
  },
);
