-- Add sold_out flag to stock_items. Lets admins mark a plant as sold out
-- without deleting the row, so it can be restored when restocked.

alter table public.stock_items
  add column if not exists sold_out boolean not null default false;
