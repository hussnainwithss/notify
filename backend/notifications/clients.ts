import { users } from "~encore/clients";
import { APIError, ErrCode } from "encore.dev/api";
import { NotificationUserModel } from "./types";
import log from "encore.dev/log";

export const fetchUser = async (
  userId: string,
): Promise<NotificationUserModel | null> => {
  try {
    const user = await users.getUser({ id: userId });
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      isActive: user.status === "active",
    };
  } catch (e) {
    if (e instanceof APIError && e.code === ErrCode.NotFound) {
      return null; // user genuinely doesn't exist
    }
    log.error(e, "fetchUser failed");
    throw e;
  }
};
