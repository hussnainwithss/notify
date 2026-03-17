CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    recipient_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'skipped', 'failed')),

    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id)
        REFERENCES notification_users(user_id)
);
