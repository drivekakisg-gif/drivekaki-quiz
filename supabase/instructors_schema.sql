-- Instructor Connect Schema — run this in Supabase SQL Editor
-- No pricing. No money through the platform. Pure referral flywheel.

-- Verified instructors listed on the platform
create table if not exists public.instructors (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  bio              text,
  specialties      text[] default '{}',   -- e.g. ['Junction Rules', 'Parking']
  areas            text[] default '{}',   -- e.g. ['Tampines', 'Bedok']
  driving_centre   text,                  -- 'CDC' | 'BBDC' | 'SSDC' | 'Private'
  experience_years integer,
  rating           numeric(3,1),
  review_count     integer default 0,
  referral_topics  text[] default '{}',   -- 'theory_revision' | 'simulator_practice' | 'both'
  contact_wa       text,                  -- WhatsApp number e.g. +6591234567
  contact_tg       text,                  -- Telegram handle e.g. @instructorjohn
  verified         boolean default false,
  created_at       timestamptz default now()
);

-- Tracks when a student connects with an instructor through DriveKaki
-- referred_by='drivekaki': student found instructor through app
-- referred_by='instructor': instructor sent their student to DriveKaki
create table if not exists public.instructor_matches (
  id               uuid primary key default uuid_generate_v4(),
  student_user_id  uuid references auth.users(id) on delete set null,
  instructor_id    uuid not null references public.instructors(id) on delete cascade,
  weak_topic       text,                  -- topic that triggered the suggestion
  referred_by      text not null default 'drivekaki',
  created_at       timestamptz default now()
);

-- Intake form for instructors who want to join the network
create table if not exists public.instructor_registrations (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  email            text not null,
  phone            text,
  driving_centre   text,
  areas            text[] default '{}',
  referral_topics  text[] default '{}',
  bio              text,
  status           text default 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at       timestamptz default now()
);

-- Indexes
create index if not exists instructor_matches_instructor_id_idx on public.instructor_matches(instructor_id);
create index if not exists instructor_matches_referred_by_idx   on public.instructor_matches(referred_by);

-- RLS
alter table public.instructors             enable row level security;
alter table public.instructor_matches      enable row level security;
alter table public.instructor_registrations enable row level security;

-- Instructors: public read
create policy "instructors_public_read"
  on public.instructors for select using (true);

-- Matches: anyone can insert (tracks guest connections too), own rows only for select
create policy "instructor_matches_insert"
  on public.instructor_matches for insert with check (true);

create policy "instructor_matches_own_read"
  on public.instructor_matches for select
  using (student_user_id = auth.uid());

-- Registrations: anyone can submit a registration
create policy "instructor_reg_insert"
  on public.instructor_registrations for insert with check (true);

-- ── Seed data ────────────────────────────────────────────────────────────────
insert into public.instructors
  (name, bio, specialties, areas, driving_centre, experience_years, rating, review_count, referral_topics, contact_wa, contact_tg, verified)
values
  (
    'Ravi Kumar',
    'CDC-certified instructor with 12 years on the road. I specialise in nervous first-timers and students who struggle with junction judgement and traffic rules. I send all my students to DriveKaki to revise theory before we start practical — it saves everyone at least 2-3 lessons.',
    ARRAY['Junction Rules', 'Traffic Signs', 'Parking'],
    ARRAY['Tampines', 'Bedok', 'Pasir Ris'],
    'CDC', 12, 4.9, 87,
    ARRAY['theory_revision', 'simulator_practice'],
    '+6591234567', '@ravicdc', true
  ),
  (
    'Michelle Tan',
    'Former BTT examiner turned private instructor. I know exactly what examiners are looking for. My students who come in having already mastered the theory consistently pass on fewer attempts.',
    ARRAY['Speed Limits', 'Traffic Signs', 'Road Markings', 'Expressway Rules'],
    ARRAY['Jurong', 'Clementi', 'Buona Vista', 'Boon Lay'],
    'BBDC', 8, 4.8, 64,
    ARRAY['theory_revision'],
    '+6598765432', null, true
  ),
  (
    'Ahmad Fadzillah',
    'Circuit confidence is my specialty. Students who practice parking and slope starts on the simulator before coming to me progress significantly faster — and waste fewer lesson hours on the basics.',
    ARRAY['Circuit Skills', 'Parking', 'Slope Start', 'Directional Change'],
    ARRAY['Ang Mo Kio', 'Bishan', 'Toa Payoh', 'Serangoon'],
    'SSDC', 6, 4.7, 41,
    ARRAY['simulator_practice', 'both'],
    '+6581234567', '@ahmaddrives', true
  ),
  (
    'Priya Nair',
    'Patient, calm instructor focused on anxious learners. I insist on solid theory foundations before our first practical session — students who understand the rules are safer and more confident on the road.',
    ARRAY['Traffic Signs', 'Junction Rules', 'Lane Discipline', 'Pedestrian Rules'],
    ARRAY['Woodlands', 'Yishun', 'Sembawang', 'Admiralty'],
    'CDC', 9, 4.8, 56,
    ARRAY['theory_revision'],
    '+6592345678', null, true
  ),
  (
    'Kevin Lim',
    'Defensive driving and night driving specialist with 15 years of experience. My students who use DriveKaki for theory before lessons consistently take fewer total hours. Theory and practical reinforce each other.',
    ARRAY['Expressway Driving', 'Night Driving', 'Defensive Driving', 'Highway Rules'],
    ARRAY['Hougang', 'Punggol', 'Sengkang', 'Buangkok'],
    'Private', 15, 4.9, 112,
    ARRAY['both'],
    '+6593456789', '@kevinlimdrives', true
  );
