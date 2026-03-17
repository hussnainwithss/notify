import { Subscription } from "encore.dev/pubsub";
import { userCreatedTopic, userUpdatedTopic } from "../users/events";
import { db } from "./db";

const _userCreated = new Subscription(
  userCreatedTopic,
  "create-notification-user",
  {
    handler: async (event) => {
      await db.exec`
        INSERT INTO notification_users (user_id, name, email, is_active)
            VALUES (${event.userId}, ${event.name}, ${event.email}, ${event.isActive})
        ON CONFLICT (user_id) DO NOTHING`;
    },
  },
);

const _userUpdated = new Subscription(
  userUpdatedTopic,
  "update-notification-user",
  {
    handler: async (event) => {
      await db.exec`
        INSERT INTO notification_users (user_id, name, email, is_active)
          VALUES (${event.userId}, ${event.name}, ${event.email}, ${event.isActive})
        ON CONFLICT (user_id)
        DO UPDATE SET
          name = ${event.name},
          email = ${event.email},
          is_active = ${event.isActive},
          synced_at = NOW()`;
    },
  },
);
