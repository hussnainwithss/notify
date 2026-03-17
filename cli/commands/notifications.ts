import { Command } from "commander";
import type Client from "../clients/notify-client";
import type { notifications } from "../clients/notify-client";

export function registerNotificationCommands(
  program: Command,
  apiClient: Client,
) {
  const notification = program
    .command("notification")
    .description("Manage notifications");

  notification
    .command("send")
    .description("Send notification to a user")
    .requiredOption("--user-id <id>", "User ID")
    .requiredOption("--channel <channel>", "Channel (in_app, email, etc.)")
    .requiredOption("--title <title>", "Notification title")
    .requiredOption("--body <body>", "Notification body")
    .action(
      async (opts: {
        userId: string;
        channel: notifications.NotificationChannelEnum;
        title: string;
        body: string;
      }) => {
        const n = await apiClient.notifications.sendNotification({
          userId: opts.userId,
          channel: opts.channel,
          title: opts.title,
          body: opts.body,
        });
        console.log("Notification sent:", n);
      },
    );

  notification
    .command("list")
    .description("List notifications for a user")
    .requiredOption("--user-id <id>", "User ID")
    .action(async (opts: { userId: string }) => {
      const resp = await apiClient.notifications.getNotifications({
        userId: opts.userId,
      });
      console.table(resp.notifications);
    });

  notification
    .command("unread")
    .description("List unread notifications for a user")
    .requiredOption("--user-id <id>", "User ID")
    .action(async (opts: { userId: string }) => {
      const resp = await apiClient.notifications.getUnReadNotifications({
        userId: opts.userId,
      });
      console.table(resp.notifications);
    });

  notification
    .command("read")
    .description("Mark a notification as read")
    .requiredOption("--id <id>", "Notification ID")
    .action(async (opts: { id: string }) => {
      const n = await apiClient.notifications.markNotificationRead(opts.id);
      console.log("Marked read:", n);
    });
}
