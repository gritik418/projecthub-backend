import { z } from "zod";
import { TaskPriority, TaskStatus } from "../../generated/prisma/enums.js";

const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(200, "Task title cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  status: z.enum(TaskStatus).default("TODO"),

  priority: z.enum(TaskPriority).default("MEDIUM"),

  dueDate: z.string().min(1, "Due date is required"),

  projectId: z.uuid("Invalid project ID"),

  assignedDeveloperId: z.uuid("Invalid developer ID"),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export default CreateTaskSchema;
