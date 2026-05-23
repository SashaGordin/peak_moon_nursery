-- Update hours copy to reflect seasonal daylight-hours schedule.
alter table public.site_settings
  alter column hours set default 'Open daylight hours, mid-March through end of June';

update public.site_settings
  set hours = 'Open daylight hours, mid-March through end of June'
  where id = 1;
