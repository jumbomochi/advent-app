insert into days (day_number, date, unlock_at, activity_type, activity_title, activity_body, activity_answer, expected_minutes, media_type, coupon_text, points) values
  (1, '2026-04-17', '2026-04-17 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'video',             '[TODO: coupon]', 10),
  (2, '2026-04-18', '2026-04-18 15:00+08', 'creative', '[TODO: title]', '[TODO: instructions]', null,    20, 'video',             '[TODO: coupon]', 10),
  (3, '2026-04-19', '2026-04-19 15:00+08', 'quiz',     '[TODO: title]', '[TODO: quiz body]',   '[TODO]', 10, 'video',             '[TODO: coupon]', 10),
  (4, '2026-04-20', '2026-04-20 15:00+08', 'kindness', '[TODO: title]', '[TODO: mission]',     null,    15, 'video',             '[TODO: coupon]', 15),
  (5, '2026-04-21', '2026-04-21 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'mystery_photos',    '[TODO: coupon]', 15),
  (6, '2026-04-22', '2026-04-22 15:00+08', 'creative', '[TODO: title]', '[TODO: instructions]', null,    20, 'video',             '[TODO: coupon]', 15),
  (7, '2026-04-23', '2026-04-23 15:00+08', 'quiz',     '[TODO: title]', '[TODO: quiz body]',   '[TODO]', 10, 'animated_postcard', '[TODO: coupon]', 20),
  (8, '2026-04-24', '2026-04-24 15:00+08', 'kindness', '[TODO: title]', '[TODO: mission]',     null,    15, 'video',             '[TODO: coupon]', 20),
  (9, '2026-04-25', '2026-04-25 15:00+08', 'riddle',   '[TODO: title]', '[TODO: riddle body]', '[TODO]', 10, 'montage',           '[TODO: coupon]', 20);

-- Initial PIN: 1234 (MUST be rotated via admin UI in production)
insert into household_pin (id, pin_hash) values (1, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
