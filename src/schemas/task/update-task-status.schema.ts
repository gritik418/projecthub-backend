import { z } from "zod";
import { TaskStatus } from "../../generated/prisma/enums.js";

const UpdateTaskStatusSchema = z.object({
  status: z.enum(TaskStatus),
});

export type UpdateTaskStatusDto = z.infer<typeof UpdateTaskStatusSchema>;

export default UpdateTaskStatusSchema;
