import { DeliveryStatusEnum, NotificationChannelEnum } from "./enums";

export interface NotificationModel {
  id: string;
  deliveryStatus: DeliveryStatusEnum;
  recipientId: string;
  channel: NotificationChannelEnum;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
}

export interface NotificationUserModel {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
  syncedAt?: Date;
}
