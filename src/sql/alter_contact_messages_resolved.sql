-- Run once if your database was created before `resolved` existed on contact_messages.
ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
