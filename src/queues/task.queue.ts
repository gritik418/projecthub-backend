import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const taskQueue = new Queue("task", {
  connection: redis,
});
