create table if not exists sticker_completions (
  day_number int primary key references days(day_number) on delete cascade,
  collected_at timestamptz not null default now()
);
