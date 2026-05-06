export type UserRole = 'student' | 'teacher' | 'admin';
export type QuestionType = 'verbal' | 'numeric';
export type QuestionStatus = 'new' | 'tur' | 'error' | 'completed' | 'archived';
export type AttemptType = 'normal' | 'tur' | 'error_repeat' | 'review';
export type ExamType = 'LGS' | 'TYT' | 'AYT' | 'ALL';
export type ImportStatus = 'pending' | 'processing' | 'review' | 'completed' | 'failed';
export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type TargetType = 'question_count' | 'correct_count' | 'streak' | 'duration';
export type BadgeConditionType = 'streak' | 'count' | 'accuracy' | 'challenge' | 'error_cleared';
export type Platform = 'ios' | 'android';
export type DailyPackQuestionStatus = 'pending' | 'completed' | 'skipped';
export type SourceType = 'pdf' | 'image' | 'manual' | 'json';

export interface Profile {
  id: string;
  real_name: string;
  nickname: string;
  avatar_url: string | null;
  role: UserRole;
  daily_target: number;
  xp: number;
  streak_count: number;
  last_active: string | null;
  created_at: string;
}

export interface CoachAssignment {
  id: string;
  coach_id: string;
  student_id: string;
  assigned_at: string;
  is_active: boolean;
}

export interface Subject {
  id: string;
  name: string;
  exam: ExamType;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  term: 1 | 2 | null;
}

export interface Question {
  id: string;
  content: string;
  question_type: QuestionType;
  choices: Record<string, string> | null;
  choices_count: number;
  correct_answer: string;
  topic_id: string | null;
  difficulty: number;
  image_url: string | null;
  source_pdf_id: string | null;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
}

export interface StudentQuestionState {
  id: string;
  student_id: string;
  question_id: string;
  status: QuestionStatus;
  next_review_date: string | null;
  error_count: number;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  last_review_date: string | null;
  created_at: string;
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  question_id: string;
  answer: string | null;
  is_correct: boolean;
  attempt_date: string;
  attempt_type: AttemptType;
  duration_secs: number | null;
  synced_at: string | null;
}

export interface ScratchpadData {
  id: string;
  student_id: string;
  question_id: string;
  drawing_data: object;
  updated_at: string;
}

export interface DailyPack {
  id: string;
  student_id: string;
  pack_date: string;
  target_count: number;
  completed_count: number;
  is_completed: boolean;
  created_at: string;
}

export interface DailyPackQuestion {
  id: string;
  pack_id: string;
  question_id: string;
  position: number;
  status: DailyPackQuestionStatus;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_type: TargetType;
  subject_id: string | null;
  topic_id: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  student_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  condition_type: BadgeConditionType;
  condition_value: number;
  condition_extra: object | null;
}

export interface StudentBadge {
  student_id: string;
  badge_id: string;
  earned_at: string;
}

export interface PushToken {
  id: string;
  student_id: string;
  expo_token: string;
  platform: Platform;
  updated_at: string;
}

export interface QuestionImport {
  id: string;
  uploaded_by: string;
  source_type: SourceType;
  storage_path: string | null;
  status: ImportStatus;
  total_pages: number | null;
  extracted_count: number;
  reviewed_count: number;
  error_log: object | null;
  created_at: string;
  completed_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      coach_assignments: { Row: CoachAssignment; Insert: Partial<CoachAssignment>; Update: Partial<CoachAssignment> };
      subjects: { Row: Subject; Insert: Partial<Subject>; Update: Partial<Subject> };
      topics: { Row: Topic; Insert: Partial<Topic>; Update: Partial<Topic> };
      questions: { Row: Question; Insert: Partial<Question>; Update: Partial<Question> };
      student_question_state: { Row: StudentQuestionState; Insert: Partial<StudentQuestionState>; Update: Partial<StudentQuestionState> };
      student_attempts: { Row: StudentAttempt; Insert: Partial<StudentAttempt>; Update: Partial<StudentAttempt> };
      scratchpad_data: { Row: ScratchpadData; Insert: Partial<ScratchpadData>; Update: Partial<ScratchpadData> };
      daily_packs: { Row: DailyPack; Insert: Partial<DailyPack>; Update: Partial<DailyPack> };
      daily_pack_questions: { Row: DailyPackQuestion; Insert: Partial<DailyPackQuestion>; Update: Partial<DailyPackQuestion> };
      challenges: { Row: Challenge; Insert: Partial<Challenge>; Update: Partial<Challenge> };
      challenge_participants: { Row: ChallengeParticipant; Insert: Partial<ChallengeParticipant>; Update: Partial<ChallengeParticipant> };
      badges: { Row: Badge; Insert: Partial<Badge>; Update: Partial<Badge> };
      student_badges: { Row: StudentBadge; Insert: Partial<StudentBadge>; Update: Partial<StudentBadge> };
      push_tokens: { Row: PushToken; Insert: Partial<PushToken>; Update: Partial<PushToken> };
      question_imports: { Row: QuestionImport; Insert: Partial<QuestionImport>; Update: Partial<QuestionImport> };
    };
  };
};
