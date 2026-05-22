-- Split stock_items into in-stock and wholesale sections.
-- Existing rows become in-stock; wholesale starts empty. The client
-- curates wholesale separately via the admin UI.

begin;

alter table public.stock_items
  add column if not exists section text not null default 'in_stock'
    check (section in ('in_stock', 'wholesale'));

create unique index if not exists stock_items_unique_per_section
  on public.stock_items (
    lower(trim(name)),
    lower(trim(coalesce(variety, ''))),
    lower(trim(coalesce(pot_size, ''))),
    section
  );

commit;
