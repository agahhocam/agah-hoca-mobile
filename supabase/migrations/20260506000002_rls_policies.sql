-- ============================================================
-- agah hoca — Row Level Security (RLS) Politikaları
-- Tarih: 2026-05-06
-- ============================================================

-- RLS'yi tüm tablolarda aktive et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_question_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratchpad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_pack_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamp_havuzu_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamp_havuzu_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_imports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================

-- Öğrenci kendi profilini okuyabilir
CREATE POLICY "student_read_own_profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Öğretmen atandığı öğrencileri görebilir (real_name dahil)
CREATE POLICY "teacher_read_assigned_students"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid()
    AND student_id = profiles.id
    AND is_active = true
  )
);

-- Admin herkesi görebilir
CREATE POLICY "admin_read_all_profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "user_update_own_profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Kullanıcı kendi profilini oluşturabilir (kayıt akışında)
CREATE POLICY "user_insert_own_profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================
-- coach_assignments
-- ============================================================
CREATE POLICY "teacher_manage_own_assignments"
ON public.coach_assignments FOR ALL
USING (auth.uid() = coach_id);

CREATE POLICY "student_read_own_assignment"
ON public.coach_assignments FOR SELECT
USING (auth.uid() = student_id);

-- ============================================================
-- subjects & topics — Herkes okuyabilir, sadece teacher/admin yazabilir
-- ============================================================
CREATE POLICY "anyone_read_subjects"
ON public.subjects FOR SELECT USING (true);

CREATE POLICY "teacher_manage_subjects"
ON public.subjects FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

CREATE POLICY "anyone_read_topics"
ON public.topics FOR SELECT USING (true);

CREATE POLICY "teacher_manage_topics"
ON public.topics FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- ============================================================
-- questions
-- ============================================================
CREATE POLICY "anyone_read_active_questions"
ON public.questions FOR SELECT
USING (is_active = true);

CREATE POLICY "teacher_manage_questions"
ON public.questions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- ============================================================
-- student_question_state
-- ============================================================
CREATE POLICY "student_read_own_state"
ON public.student_question_state FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "student_write_own_state"
ON public.student_question_state FOR ALL
USING (auth.uid() = student_id);

CREATE POLICY "teacher_read_assigned_state"
ON public.student_question_state FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid()
    AND student_id = student_question_state.student_id
    AND is_active = true
  )
);

-- ============================================================
-- student_attempts
-- ============================================================
CREATE POLICY "student_read_own_attempts"
ON public.student_attempts FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "student_insert_own_attempt"
ON public.student_attempts FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "teacher_read_assigned_attempts"
ON public.student_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid()
    AND student_id = student_attempts.student_id
    AND is_active = true
  )
);

-- ============================================================
-- scratchpad_data
-- ============================================================
CREATE POLICY "student_manage_own_scratchpad"
ON public.scratchpad_data FOR ALL
USING (auth.uid() = student_id);

-- ============================================================
-- daily_packs & daily_pack_questions
-- ============================================================
CREATE POLICY "student_read_own_packs"
ON public.daily_packs FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "student_update_own_pack"
ON public.daily_packs FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "service_insert_packs"
ON public.daily_packs FOR INSERT
WITH CHECK (true); -- Edge Function service role ile ekler

CREATE POLICY "student_read_own_pack_questions"
ON public.daily_pack_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.daily_packs
    WHERE id = daily_pack_questions.pack_id
    AND student_id = auth.uid()
  )
);

CREATE POLICY "student_update_own_pack_questions"
ON public.daily_pack_questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.daily_packs
    WHERE id = daily_pack_questions.pack_id
    AND student_id = auth.uid()
  )
);

-- ============================================================
-- challenges
-- ============================================================
CREATE POLICY "anyone_read_active_challenges"
ON public.challenges FOR SELECT
USING (is_active = true);

CREATE POLICY "teacher_manage_challenges"
ON public.challenges FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

-- ============================================================
-- challenge_participants
-- ============================================================
CREATE POLICY "student_read_own_participation"
ON public.challenge_participants FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "student_join_challenge"
ON public.challenge_participants FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "student_update_own_participation"
ON public.challenge_participants FOR UPDATE
USING (auth.uid() = student_id);

-- ============================================================
-- badges
-- ============================================================
CREATE POLICY "anyone_read_badges"
ON public.badges FOR SELECT USING (true);

CREATE POLICY "admin_manage_badges"
ON public.badges FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- student_badges
-- ============================================================
CREATE POLICY "student_read_own_badges"
ON public.student_badges FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "teacher_read_assigned_badges"
ON public.student_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_id = auth.uid()
    AND student_id = student_badges.student_id
    AND is_active = true
  )
);

-- ============================================================
-- kamp_havuzu_1 & kamp_havuzu_2
-- ============================================================
CREATE POLICY "student_read_own_kamp1"
ON public.kamp_havuzu_1 FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_manage_own_kamp1"
ON public.kamp_havuzu_1 FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "student_read_own_kamp2"
ON public.kamp_havuzu_2 FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "student_manage_own_kamp2"
ON public.kamp_havuzu_2 FOR ALL USING (auth.uid() = student_id);

-- ============================================================
-- push_tokens
-- ============================================================
CREATE POLICY "student_manage_own_push_token"
ON public.push_tokens FOR ALL
USING (auth.uid() = student_id);

-- ============================================================
-- question_imports
-- ============================================================
CREATE POLICY "teacher_manage_imports"
ON public.question_imports FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
