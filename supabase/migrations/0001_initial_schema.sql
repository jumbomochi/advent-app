create table days (
  day_number int primary key check (day_number between 1 and 9),
  date date not null unique,
  unlock_at timestamptz not null,
  activity_type text not null check (activity_type in ('riddle','quiz','creative','kindness')),
  activity_title text not null,
  activity_body text not null,
  activity_answer text,
  expected_minutes int not null default 15,
  media_type text not null check (media_type in ('video','mystery_photos','animated_postcard','montage')),
  coupon_text text not null,
  points int not null default 10,
  media_storage_path text,
  media_config jsonb not null default '{}'::jsonb
);

create table completions (
  day_number int primary key references days(day_number) on delete cascade,
  completed_at timestamptz not null default now(),
  photo_storage_path text,
  notes text
);

create table kid_tile_completions (
  day_number int primary key references days(day_number) on delete cascade,
  completed_at timestamptz not null default now()
);

create table admin_users (
  email text primary key
);

create table household_pin (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table login_attempts (
  ip text primary key,
  failed_count int not null default 0,
  blocked_until timestamptz
);

create table audit_log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  actor text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb
);

insert into storage.buckets (id, name, public) values
  ('media', 'media', false),
  ('mystery', 'mystery', false),
  ('photos', 'photos', false);
