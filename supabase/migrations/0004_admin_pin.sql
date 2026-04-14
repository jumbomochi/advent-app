create table if not exists admin_pin (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

insert into admin_pin (id, pin_hash)
values (1, '$2b$10$suHpRbLpES3KpanL14Xff.C2aBHaTokzxYn0Ng7P45rKqLtNYZlFi')
on conflict (id) do nothing;
