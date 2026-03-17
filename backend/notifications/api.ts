import { api } from "encore.dev/api";
import { APIError, ErrCode } from "encore.dev/api";
import log from "encore.dev/log";
import { db } from "./db";
import { DeliveryStatusEnum, NotificationChannelEnum } from "./enums";
import { NotificationModel, NotificationUserModel } from "./types";
import { SendEmailNotification, SendInAppNotification } from "./providers";
import { fetchUser } from "./clients";

interface SendNotificationReq {
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannelEnum;
}

export const sendNotification = api<SendNotificationReq, NotificationModel>(
  { method: "POST", path: "/notifications", expose: true },
  async (req: SendNotificationReq): Promise<NotificationModel> => {
    let user: NotificationUserModel | null =
      await db.queryRow<NotificationUserModel>`
      SELECT user_id as "userId", email, name, is_active as "isActive" FROM notification_users WHERE user_id = ${req.userId}`;

    log.info("user", { user });
    if (!user) {
      user = await fetchUser(req.userId);
      if (user == null) {
        throw new APIError(
          ErrCode.FailedPrecondition,
          "user not found to send notification",
        );
      }
      await db.exec`
        INSERT INTO notification_users (user_id, email, name, is_active)
          VALUES (${user.userId}, ${user.email}, ${user.name}, ${user.isActive})
        ON CONFLICT (user_id) DO UPDATE
          SET email = ${user.email}, name = ${user.name}, is_active = ${user.isActive}
      `;
    }

    if (!user.isActive) {
      throw new APIError(
        ErrCode.FailedPrecondition,
        "user is not active to send notification",
      );
    }

    const notification: NotificationModel | null =
      await db.queryRow<NotificationModel>`
      INSERT INTO notifications (recipient_id, title, body, channel)
        VALUES (${req.userId}, ${req.title}, ${req.body}, ${req.channel})
      RETURNING
        id,
        channel,
        title,
        body,
        recipient_id as "recipientId",
        delivery_status as "deliveryStatus",
        created_at as "createdAt",
        updated_at as "updatedAt",
        is_read as "isRead";`;
    if (!notification) {
      throw new APIError(ErrCode.Internal, "error creating notification");
    }

    let result = false;
    switch (notification.channel) {
      case NotificationChannelEnum.EMAIL:
        result = await SendEmailNotification(
          user.email,
          notification.title,
          notification.body,
        );
        break;
      case NotificationChannelEnum.IN_APP:
        result = await SendInAppNotification(
          notification.recipientId,
          notification.title,
          notification.body,
        );
        break;
      default:
        throw new APIError(
          ErrCode.InvalidArgument,
          "invalid notification channel",
        );
    }

    if (!result) {
      await db.exec`
        UPDATE notifications
         SET delivery_status = ${DeliveryStatusEnum.FAILED}
        WHERE id = ${notification.id}`;
      notification.deliveryStatus = DeliveryStatusEnum.FAILED;
      throw new APIError(ErrCode.Internal, "error sending notification");
    } else {
      switch (notification.channel) {
        case NotificationChannelEnum.EMAIL:
          await db.exec`
          UPDATE notifications
           SET delivery_status = ${DeliveryStatusEnum.SENT},
            is_read = true
          WHERE id = ${notification.id}`;
          break;
        case NotificationChannelEnum.IN_APP:
          await db.exec`
            UPDATE notifications
             SET delivery_status = ${DeliveryStatusEnum.SENT}
            WHERE id = ${notification.id}`;
          break;
        default:
          throw new APIError(
            ErrCode.InvalidArgument,
            "invalid notification channel",
          );
      }
      notification.deliveryStatus = DeliveryStatusEnum.SENT;
    }

    return notification;
  },
);

export const getNotifications = api(
  { method: "GET", path: "/notifications", expose: true },
  async ({
    userId,
  }: {
    userId: string;
  }): Promise<{ notifications: NotificationModel[] }> => {
    const rows = db.query<NotificationModel>`
      SELECT
        id,
        channel,
        title,
        body,
        recipient_id as "recipientId",
        delivery_status as "deliveryStatus",
        created_at as "createdAt",
        updated_at as "updatedAt",
        is_read as "isRead"
      FROM notifications
      WHERE recipient_id = ${userId}`;
    const notifications: NotificationModel[] = [];
    for await (const row of rows) {
      notifications.push(row);
    }
    return { notifications };
  },
);

export const getUnReadNotifications = api(
  { method: "GET", path: "/notifications/unread", expose: true },
  async ({
    userId,
  }: {
    userId: string;
  }): Promise<{ notifications: NotificationModel[] }> => {
    const rows = db.query<NotificationModel>`
      SELECT
        id,
        channel,
        title,
        body,
        recipient_id as "recipientId",
        delivery_status as "deliveryStatus",
        created_at as "createdAt",
        updated_at as "updatedAt",
        is_read as "isRead"
      FROM notifications
      WHERE
        recipient_id = ${userId}
        AND delivery_status = ${DeliveryStatusEnum.SENT}
        AND is_read = false;`;
    const notifications: NotificationModel[] = [];
    for await (const row of rows) {
      notifications.push(row);
    }
    return { notifications };
  },
);

export const markNotificationRead = api(
  { method: "PATCH", path: "/notifications/:id/read", expose: true },
  async ({ id }: { id: string }): Promise<NotificationModel> => {
    let notification: NotificationModel | null =
      await db.queryRow<NotificationModel>`
      SELECT
        id,
        channel,
        title,
        body,
        recipient_id as "recipientId",
        delivery_status as "deliveryStatus",
        created_at as "createdAt",
        updated_at as "updatedAt",
        is_read as "isRead"
      FROM notifications where id = ${id};`;
    if (notification == null) {
      throw new APIError(ErrCode.NotFound, "notification not found");
    }
    if (notification.deliveryStatus !== DeliveryStatusEnum.SENT) {
      throw new APIError(
        ErrCode.FailedPrecondition,
        "notification is not sent",
      );
    }

    notification = await db.queryRow<NotificationModel>`
    UPDATE notifications
      SET is_read = true
    WHERE id = ${id}
    RETURNING
      id,
      channel,
      title,
      body,
      recipient_id as "recipientId",
      delivery_status as "deliveryStatus",
      created_at as "createdAt",
      updated_at as "updatedAt",
      is_read as "isRead";`;

    // safe guard just to silence that null exception
    if (notification == null) {
      throw new APIError(ErrCode.NotFound, "notification not found");
    }

    return notification;
  },
);
