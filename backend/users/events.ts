import { Topic } from "encore.dev/pubsub";

export interface UserEvent {
  userId: string;
  email: string;
  name: string;
  isActive: boolean;
}

export const userCreatedTopic = new Topic<UserEvent>("user-created", {
  deliveryGuarantee: "at-least-once",
});

export const userUpdatedTopic = new Topic<UserEvent>("user-updated", {
  deliveryGuarantee: "at-least-once",
});
