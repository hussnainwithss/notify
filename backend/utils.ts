import { z, ZodType } from "zod";
import { APIError, ErrCode } from "encore.dev/api";

export function validateOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    throw new APIError(ErrCode.InvalidArgument, message);
  }
  return parsed.data;
}

const UUIDSchema = z.uuid("invalid id");

export function validateUUIDOrThrow(input: unknown): string {
  return validateOrThrow(UUIDSchema, input);
}

export interface AuthData {
  userID: string;
  roles: string[];
}

export function requireRole(auth: AuthData | null, role: string): void {
  if (!auth?.roles.includes(role)) {
    throw new APIError(ErrCode.PermissionDenied, `requires ${role} role`);
  }
}
