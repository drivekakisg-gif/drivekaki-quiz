-- National benchmarks + waiting times — run in Supabase SQL Editor

create table if not exists public.national_benchmarks (
  id           uuid primary key default uuid_generate_v4(),
  test_type    text not null,   -- 'BTT' | 'FTT' | 'Class 3' | 'Class 3A' | 'Class 2B' | 'Class 2A' | 'Class 2'
  centre       text not null,   -- 'SSDC' | 'BBDC' | 'CDC' | 'Private'
  is_retest    boolean default false,
  period       text not null,
  total_tested integer not null,
  total_passed integer not null,
  pass_pct     smallint not null,
  updated_at   timestamptz default now()
);

create table if not exists public.test_waiting_times (
  id              uuid primary key default uuid_generate_v4(),
  test_type       text not null,
  centre          text not null,
  is_private_lane boolean default false,
  month           text not null,  -- 'Nov-25' | 'Dec-25' | 'Jan-26'
  waiting_months  numeric(3,1) not null,
  updated_at      timestamptz default now()
);

alter table public.national_benchmarks  enable row level security;
alter table public.test_waiting_times   enable row level security;

create policy "benchmarks_public_read" on public.national_benchmarks for select using (true);
create policy "waiting_times_public_read" on public.test_waiting_times for select using (true);

-- ── National benchmarks seed (Feb 25 – Jan 26) ───────────────────────────────
insert into public.national_benchmarks (test_type, centre, is_retest, period, total_tested, total_passed, pass_pct) values
  -- BTT first-time
  ('BTT', 'SSDC',    false, 'Feb 25 – Jan 26',  8181, 7056, 86),
  ('BTT', 'BBDC',    false, 'Feb 25 – Jan 26', 12096,11219, 93),
  ('BTT', 'CDC',     false, 'Feb 25 – Jan 26', 17538,15094, 86),
  ('BTT', 'Private', false, 'Feb 25 – Jan 26', 32099,21781, 68),
  -- FTT first-time
  ('FTT', 'SSDC',    false, 'Feb 25 – Jan 26',  5499, 4983, 91),
  ('FTT', 'BBDC',    false, 'Feb 25 – Jan 26',  8299, 8061, 97),
  ('FTT', 'CDC',     false, 'Feb 25 – Jan 26', 11977,10249, 86),
  ('FTT', 'Private', false, 'Feb 25 – Jan 26', 12561, 9452, 75),
  -- Class 3 first-time
  ('Class 3', 'SSDC',    false, 'Feb 25 – Jan 26', 3821, 1538, 40),
  ('Class 3', 'BBDC',    false, 'Feb 25 – Jan 26', 3404, 1601, 47),
  ('Class 3', 'CDC',     false, 'Feb 25 – Jan 26', 5234, 1907, 36),
  ('Class 3', 'Private', false, 'Feb 25 – Jan 26', 7246, 2088, 29),
  -- Class 3 retest
  ('Class 3', 'SSDC',    true, 'Feb 25 – Jan 26', 5162, 1913, 37),
  ('Class 3', 'BBDC',    true, 'Feb 25 – Jan 26', 3670, 1726, 47),
  ('Class 3', 'CDC',     true, 'Feb 25 – Jan 26', 6753, 2337, 35),
  ('Class 3', 'Private', true, 'Feb 25 – Jan 26',12286, 4234, 34),
  -- Class 3A first-time
  ('Class 3A', 'SSDC',    false, 'Feb 25 – Jan 26', 2211, 1137, 51),
  ('Class 3A', 'BBDC',    false, 'Feb 25 – Jan 26', 5305, 2810, 53),
  ('Class 3A', 'CDC',     false, 'Feb 25 – Jan 26', 8630, 3861, 45),
  ('Class 3A', 'Private', false, 'Feb 25 – Jan 26', 9815, 3406, 35),
  -- Class 3A retest
  ('Class 3A', 'SSDC',    true, 'Feb 25 – Jan 26', 1678,  908, 54),
  ('Class 3A', 'BBDC',    true, 'Feb 25 – Jan 26', 4133, 2301, 56),
  ('Class 3A', 'CDC',     true, 'Feb 25 – Jan 26', 8109, 4008, 49),
  ('Class 3A', 'Private', true, 'Feb 25 – Jan 26',12836, 5849, 46);

-- ── Waiting times seed (Nov-25 to Jan-26) ────────────────────────────────────
insert into public.test_waiting_times (test_type, centre, is_private_lane, month, waiting_months) values
  -- BTT school
  ('BTT','SSDC',false,'Nov-25',0.7),('BTT','SSDC',false,'Dec-25',0.7),('BTT','SSDC',false,'Jan-26',0.9),
  ('BTT','BBDC',false,'Nov-25',0.3),('BTT','BBDC',false,'Dec-25',0.3),('BTT','BBDC',false,'Jan-26',0.3),
  ('BTT','CDC', false,'Nov-25',0.3),('BTT','CDC', false,'Dec-25',0.3),('BTT','CDC', false,'Jan-26',0.2),
  -- BTT private lane
  ('BTT','SSDC',true,'Nov-25',0.7),('BTT','SSDC',true,'Dec-25',0.7),('BTT','SSDC',true,'Jan-26',0.9),
  ('BTT','BBDC',true,'Nov-25',0.3),('BTT','BBDC',true,'Dec-25',0.3),('BTT','BBDC',true,'Jan-26',0.3),
  ('BTT','CDC', true,'Nov-25',0.3),('BTT','CDC', true,'Dec-25',0.4),('BTT','CDC', true,'Jan-26',0.2),
  -- FTT school
  ('FTT','SSDC',false,'Nov-25',0.3),('FTT','SSDC',false,'Dec-25',0.5),('FTT','SSDC',false,'Jan-26',0.5),
  ('FTT','BBDC',false,'Nov-25',0.3),('FTT','BBDC',false,'Dec-25',0.4),('FTT','BBDC',false,'Jan-26',0.3),
  ('FTT','CDC', false,'Nov-25',0.3),('FTT','CDC', false,'Dec-25',0.3),('FTT','CDC', false,'Jan-26',0.2),
  -- FTT private lane
  ('FTT','SSDC',true,'Nov-25',0.5),('FTT','SSDC',true,'Dec-25',0.5),('FTT','SSDC',true,'Jan-26',0.5),
  ('FTT','BBDC',true,'Nov-25',0.3),('FTT','BBDC',true,'Dec-25',0.4),('FTT','BBDC',true,'Jan-26',0.3),
  ('FTT','CDC', true,'Nov-25',0.3),('FTT','CDC', true,'Dec-25',0.3),('FTT','CDC', true,'Jan-26',0.2),
  -- Riding Theory Test
  ('RTT','SSDC',false,'Nov-25',0.4),('RTT','SSDC',false,'Dec-25',0.4),('RTT','SSDC',false,'Jan-26',0.5),
  ('RTT','BBDC',false,'Nov-25',0.3),('RTT','BBDC',false,'Dec-25',0.3),('RTT','BBDC',false,'Jan-26',0.4),
  ('RTT','CDC', false,'Nov-25',0.3),('RTT','CDC', false,'Dec-25',0.2),('RTT','CDC', false,'Jan-26',0.6),
  -- Class 3 practical school
  ('Class 3','SSDC',false,'Nov-25',0.4),('Class 3','SSDC',false,'Dec-25',0.5),('Class 3','SSDC',false,'Jan-26',0.5),
  ('Class 3','BBDC',false,'Nov-25',0.4),('Class 3','BBDC',false,'Dec-25',0.5),('Class 3','BBDC',false,'Jan-26',0.4),
  ('Class 3','CDC', false,'Nov-25',1.2),('Class 3','CDC', false,'Dec-25',1.2),('Class 3','CDC', false,'Jan-26',1.1),
  -- Class 3 practical private lane
  ('Class 3','SSDC',true,'Nov-25',0.4),('Class 3','SSDC',true,'Dec-25',0.4),('Class 3','SSDC',true,'Jan-26',0.5),
  ('Class 3','BBDC',true,'Nov-25',0.5),('Class 3','BBDC',true,'Dec-25',0.5),('Class 3','BBDC',true,'Jan-26',0.6),
  ('Class 3','CDC', true,'Nov-25',0.4),('Class 3','CDC', true,'Dec-25',0.6),('Class 3','CDC', true,'Jan-26',0.5),
  -- Class 3A practical school
  ('Class 3A','SSDC',false,'Nov-25',0.4),('Class 3A','SSDC',false,'Dec-25',1.0),('Class 3A','SSDC',false,'Jan-26',0.8),
  ('Class 3A','BBDC',false,'Nov-25',0.4),('Class 3A','BBDC',false,'Dec-25',0.5),('Class 3A','BBDC',false,'Jan-26',0.4),
  ('Class 3A','CDC', false,'Nov-25',0.5),('Class 3A','CDC', false,'Dec-25',0.7),('Class 3A','CDC', false,'Jan-26',0.9),
  -- Class 3A practical private lane
  ('Class 3A','SSDC',true,'Nov-25',0.4),('Class 3A','SSDC',true,'Dec-25',0.4),('Class 3A','SSDC',true,'Jan-26',0.5),
  ('Class 3A','BBDC',true,'Nov-25',0.5),('Class 3A','BBDC',true,'Dec-25',0.5),('Class 3A','BBDC',true,'Jan-26',0.6),
  ('Class 3A','CDC', true,'Nov-25',0.4),('Class 3A','CDC', true,'Dec-25',0.6),('Class 3A','CDC', true,'Jan-26',0.5),
  -- Class 2B
  ('Class 2B','SSDC',false,'Nov-25',0.9),('Class 2B','SSDC',false,'Dec-25',0.8),('Class 2B','SSDC',false,'Jan-26',0.5),
  ('Class 2B','BBDC',false,'Nov-25',0.7),('Class 2B','BBDC',false,'Dec-25',1.2),('Class 2B','BBDC',false,'Jan-26',1.0),
  ('Class 2B','CDC', false,'Nov-25',2.2),('Class 2B','CDC', false,'Dec-25',1.5),('Class 2B','CDC', false,'Jan-26',1.5),
  -- Class 2A
  ('Class 2A','SSDC',false,'Nov-25',0.9),('Class 2A','SSDC',false,'Dec-25',0.9),('Class 2A','SSDC',false,'Jan-26',1.0),
  ('Class 2A','BBDC',false,'Nov-25',0.5),('Class 2A','BBDC',false,'Dec-25',0.8),('Class 2A','BBDC',false,'Jan-26',1.0),
  ('Class 2A','CDC', false,'Nov-25',0.7),('Class 2A','CDC', false,'Dec-25',0.7),('Class 2A','CDC', false,'Jan-26',1.1),
  -- Class 2
  ('Class 2','SSDC',false,'Nov-25',1.0),('Class 2','SSDC',false,'Dec-25',1.0),('Class 2','SSDC',false,'Jan-26',0.7),
  ('Class 2','BBDC',false,'Nov-25',0.5),('Class 2','BBDC',false,'Dec-25',1.0),('Class 2','BBDC',false,'Jan-26',1.2),
  ('Class 2','CDC', false,'Nov-25',1.5),('Class 2','CDC', false,'Dec-25',1.7),('Class 2','CDC', false,'Jan-26',1.7);
