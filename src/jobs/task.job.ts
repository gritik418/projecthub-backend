import { taskQueue } from "../queues/task.queue.js";

export const startTaskJobs = async () => {
  await taskQueue.upsertJobScheduler(
    "check-overdue-tasks",
    {
      every: 60* 60 * 1000,
    },
    {
      name: "check-overdue-tasks",
    },
  );
};
