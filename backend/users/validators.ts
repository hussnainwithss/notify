import { z } from "zod";
import { validateOrThrow } from "../utils";

const CreateUserSchema = z.object({
  name: z.string().min(3, "name is required, min length is 3"),
  email: z.email("invalid email"),
  dateOfBirth: z.iso.date("invalid date format, should be ISO 8601"),
});

export function validateCreateUserOrThrow(
  input: unknown,
): z.infer<typeof CreateUserSchema> {
  return validateOrThrow(CreateUserSchema, input);
}
