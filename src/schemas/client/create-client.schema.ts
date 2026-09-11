import z from "zod";

const CreateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Client name must be at least 2 characters long.")
    .max(100, "Client name cannot exceed 100 characters."),

  email: z.email("Please provide a valid email address."),

  company: z
    .string()
    .trim()
    .max(150, "Company name cannot exceed 150 characters.")
    .optional(),
});

export default CreateClientSchema;
