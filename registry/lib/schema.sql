CREATE TABLE IF NOT EXISTS tools (
  id           SERIAL PRIMARY KEY,
  owner        TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  repo_url     TEXT NOT NULL,
  subdir       TEXT,
  tags         TEXT[] DEFAULT '{}',
  downloads    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner, name)
);

ALTER TABLE tools ADD COLUMN IF NOT EXISTS subdir TEXT;

CREATE INDEX IF NOT EXISTS tools_search_idx
  ON tools USING GIN (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));
