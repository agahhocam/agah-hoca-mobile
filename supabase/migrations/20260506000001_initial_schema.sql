-- ============================================================
-- agah hoca — İlk Veritabanı Şeması
-- Tarih: 2026-05-06
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  real_name     text NOT NULL,
  nickname      text UNIQUE NOT NULL,
  avatar_url    text,
  role          text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  daily_target  int DEFAULT 50,
  xp            int DEFAULT 0,
  streak_count  int DEFAULT 0,
  last_active   date,
  created_at    timestamptz DEFAULT now()
);

-- coach_assignments
CREATE TABLE public.coach_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  is_active   boolean DEFAULT true,
  UNIQUE (coach_id, student_id)
);

-- subjects
CREATE TABLE public.subjects (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  exam  text NOT NULL CHECK (exam IN ('LGS', 'TYT', 'AYT', 'ALL'))
);

-- topics
CREATE TABLE public.topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  term        int CHECK (term IN (1, 2))
);

-- question_imports (questions'dan önce tanımlanmalı: FK için)
CREATE TABLE public.question_imports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by     uuid NOT NULL REFERENCES public.profiles(id),
  source_type     text NOT NULL CHECK (source_type IN ('pdf', 'image', 'manual', 'json')),
  storage_path    text,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'review', 'completed', 'failed')),
  total_pages     int,
  extracted_count int DEFAULT 0,
  reviewed_count  int DEFAULT 0,
  error_log       jsonb,
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

-- questions
CREATE TABLE public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content         text NOT NULL,
  question_type   text NOT NULL CHECK (question_type IN ('verbal', 'numeric')),
  choices         jsonb,
  choices_count   int DEFAULT 4,
  correct_answer  text NOT NULL,
  topic_id        uuid REFERENCES public.topics(id),
  difficulty      int DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  image_url       text,
  source_pdf_id   uuid REFERENCES public.question_imports(id),
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  is_active       boolean DEFAULT true
);

-- student_question_state (SM-2)
CREATE TABLE public.student_question_state (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id       uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  status            text DEFAULT 'new' CHECK (status IN ('new', 'tur', 'error', 'completed', 'archived')),
  next_review_date  date,
  error_count       int DEFAULT 0,
  ease_factor       float DEFAULT 2.5,
  interval_days     int DEFAULT 1,
  repetition_count  int DEFAULT 0,
  last_review_date  date,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (student_id, question_id)
);

-- student_attempts
CREATE TABLE public.student_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer          text,
  is_correct      boolean NOT NULL,
  attempt_date    timestamptz DEFAULT now(),
  attempt_type    text DEFAULT 'normal' CHECK (attempt_type IN ('normal', 'tur', 'error_repeat', 'review')),
  duration_secs   int,
  synced_at       timestamptz
);

-- scratchpad_data
CREATE TABLE public.scratchpad_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  drawing_data  jsonb NOT NULL,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (student_id, question_id)
);

-- daily_packs
CREATE TABLE public.daily_packs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pack_date       date NOT NULL,
  target_count    int NOT NULL,
  completed_count int DEFAULT 0,
  is_completed    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (student_id, pack_date)
);

-- daily_pack_questions
CREATE TABLE public.daily_pack_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id     uuid NOT NULL REFERENCES public.daily_packs(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position    int NOT NULL,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  UNIQUE (pack_id, question_id)
);

-- challenges
CREATE TABLE public.challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  challenge_type  text NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'custom')),
  target_value    int NOT NULL,
  target_type     text NOT NULL CHECK (target_type IN ('question_count', 'correct_count', 'streak', 'duration')),
  subject_id      uuid REFERENCES public.subjects(id),
  topic_id        uuid REFERENCES public.topics(id),
  created_by      uuid NOT NULL REFERENCES public.profiles(id),
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- challenge_participants
CREATE TABLE public.challenge_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress      int DEFAULT 0,
  completed     boolean DEFAULT false,
  completed_at  timestamptz,
  UNIQUE (challenge_id, student_id)
);

-- badges
CREATE TABLE public.badges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text NOT NULL,
  icon_url         text NOT NULL,
  condition_type   text NOT NULL CHECK (condition_type IN ('streak', 'count', 'accuracy', 'challenge', 'error_cleared')),
  condition_value  int NOT NULL,
  condition_extra  jsonb
);

-- student_badges
CREATE TABLE public.student_badges (
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at   timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);

-- kamp_havuzu_1
CREATE TABLE public.kamp_havuzu_1 (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  archived_at   timestamptz DEFAULT now(),
  topic_id      uuid REFERENCES public.topics(id),
  ease_factor   float DEFAULT 2.5,
  UNIQUE (student_id, question_id)
);

-- kamp_havuzu_2
CREATE TABLE public.kamp_havuzu_2 (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  archived_at   timestamptz DEFAULT now(),
  topic_id      uuid REFERENCES public.topics(id),
  ease_factor   float DEFAULT 2.5,
  UNIQUE (student_id, question_id)
);

-- push_tokens
CREATE TABLE public.push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_token  text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (student_id, platform)
);

-- ============================================================
-- İndeksler (performans için)
-- ============================================================
CREATE INDEX idx_student_attempts_student ON public.student_attempts(student_id);
CREATE INDEX idx_student_attempts_question ON public.student_attempts(question_id);
CREATE INDEX idx_student_attempts_date ON public.student_attempts(attempt_date);
CREATE INDEX idx_sqs_student ON public.student_question_state(student_id);
CREATE INDEX idx_sqs_next_review ON public.student_question_state(next_review_date);
CREATE INDEX idx_sqs_status ON public.student_question_state(status);
CREATE INDEX idx_daily_packs_student_date ON public.daily_packs(student_id, pack_date);
CREATE INDEX idx_questions_topic ON public.questions(topic_id);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_active ON public.questions(is_active);
