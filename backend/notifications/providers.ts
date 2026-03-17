import log from "encore.dev/log";

export const SendInAppNotification = async (
  userId: string,
  title: string,
  body: string,
) => {
  log.info("SendInAppNotification", { userId, title, body });
  return true;
};
export const SendEmailNotification = async (
  email: string,
  title: string,
  body: string,
) => {
  log.info("SendEmailNotification", { email, title, body });
  return true;
};
