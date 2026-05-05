create table public.stock_items (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  variety     text,
  notes       text,
  price       text,
  stock       integer,
  category    text,
  created_at  timestamptz default now()
);

create table public.coming_soon_items (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  variety     text,
  notes       text,
  eta         text,
  created_at  timestamptz default now()
);

create table public.events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

create table public.site_settings (
  id               integer primary key default 1,
  hours            text not null default 'Saturdays & Sundays, 10am–4pm',
  contact_email    text not null default '',
  contact_phone    text not null default '',
  stock_updated_at timestamptz,
  constraint single_row check (id = 1)
);

insert into public.site_settings (id) values (1);

create table public.signups (
  id          uuid default gen_random_uuid() primary key,
  name        text,
  email       text unique not null,
  interests   text,
  created_at  timestamptz default now()
);

alter table public.stock_items enable row level security;
alter table public.coming_soon_items enable row level security;
alter table public.events enable row level security;
alter table public.site_settings enable row level security;
alter table public.signups enable row level security;

insert into public.stock_items (name, variety, notes, price, stock, category) values
  ('Cherokee Purple Tomato', 'Heirloom · indeterminate', 'Smoky, sweet, big slicer. A bench favorite.', '$5', 12, 'Tomato'),
  ('Sungold Tomato',         'Cherry · indeterminate',   'Candy-sweet orange cherries. Goes fast.',   '$5',  4, 'Tomato'),
  ('Genovese Basil',         'Classic Italian',          'Full sun, pinch the tops, eat well.',        '$4', 24, 'Herb'),
  ('Lacinato Kale',          'Tuscan / ''dinosaur''',    'Cold-hardy, productive all season.',         '$4', 18, 'Greens'),
  ('Marigold ''Queen Sophia''', 'Annual flower',         'Cheerful companion for tomatoes.',           '$4', 30, 'Flower'),
  ('Costata Romanesco Squash', 'Italian zucchini',       'Nutty, ribbed, unbeatable on the grill.',    '$5',  6, 'Squash');

insert into public.coming_soon_items (name, variety, notes, eta) values
  ('Sweet Peppers', 'Several varieties',              'Hardening off now — bench-ready next week.', 'Next week'),
  ('Hot Peppers',   'Jalapeño, Shishito, Serrano',    'Same wave as sweets.',                       'Next week'),
  ('Eggplant',      'Listada de Gandia, Black Beauty','Loves the warm bench.',                      'Mid-May'),
  ('Cucumbers',     'Marketmore, Lemon',              'Direct-sown coming soon.',                   'Late May');

insert into public.events (title, description, date) values
  ('Open weekend',            'Stop by the bench — first big restock of the year.', '2026-05-09'),
  ('Pepper-day pop-up',       'All the heats and sweets, all at once.',             '2026-05-16'),
  ('Vashon Garden Tour stop', 'We''ll be on the route — come say hi.',              '2026-06-13');
