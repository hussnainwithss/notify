import { z } from "zod";
import { NotificationChannelEnum } from "./enums";
import { validateOrThrow } from "../utils";

const SendNotifcationSchema = z.object({
  userId: z.uuid("invalid user id"),
  title: z.string().min(5, "title is required, min length is 5"),
  body: z.string().min(5, "body is required, min length is 5"),
  channel: z.enum(
    Object.values(NotificationChannelEnum) as [string, ...string[]],
  ),
});

export function validateSendNotificationOrThrow(
  input: unknown,
): z.infer<typeof SendNotifcationSchema> {
  return validateOrThrow(SendNotifcationSchema, input);
}
