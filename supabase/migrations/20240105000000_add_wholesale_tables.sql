CREATE TABLE wholesale_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  name       text NOT NULL,
  email      text,
  notes      text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wholesale_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE wholesale_orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id    uuid REFERENCES wholesale_tokens(id),
  buyer_name  text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  notes       text,
  items       jsonb NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;
