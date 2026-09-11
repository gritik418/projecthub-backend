import z from "zod";

const CreateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters long.")
    .max(100, "Project name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(800, "Project description cannot exceed 800 characters.")
    .optional(),

  clientId: z.uuid("Invalid client ID."),
});

export default CreateProjectSchema;
