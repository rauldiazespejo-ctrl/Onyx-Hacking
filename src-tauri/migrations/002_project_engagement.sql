-- Authorized engagement / scope (per project)

ALTER TABLE projects ADD COLUMN client_name TEXT;
ALTER TABLE projects ADD COLUMN client_contact TEXT;
ALTER TABLE projects ADD COLUMN authorized_scope TEXT;
ALTER TABLE projects ADD COLUMN engagement_start TEXT;
ALTER TABLE projects ADD COLUMN engagement_end TEXT;
ALTER TABLE projects ADD COLUMN authorization_reference TEXT;
ALTER TABLE projects ADD COLUMN authorization_acknowledged INTEGER NOT NULL DEFAULT 0;
