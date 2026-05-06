import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { computeSM2Update } from '../utils/sm2';
import type { Question, StudentQuestionState, QuestionStatus, AttemptType } from '../types/database';

export type FeedQuestion = Question & { state: StudentQuestionState | null };

export function useQuestionFeed() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<FeedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  async function load() {
    if (!user) return;
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // 1. Günlük paketin var mı?
    const { data: pack } = await (supabase
      .from('daily_packs') as any)
      .select('id')
      .eq('student_id', user.id)
      .eq('pack_date', today)
      .single();

    if (pack) {
      const { data: pqs } = await (supabase
        .from('daily_pack_questions') as any)
        .select('question_id, position, questions(*)')
        .eq('pack_id', pack.id)
        .eq('status', 'pending')
        .order('position');

      if (pqs && pqs.length > 0) {
        await attachStates(pqs.map((pq: any) => ({ ...pq.questions, state: null })), user.id);
        setIsLoading(false);
        return;
      }
    }

    // 2. Tekrar zamanı gelen sorular (SM-2)
    const { data: stateRows } = await (supabase
      .from('student_question_state') as any)
      .select('*, questions(*)')
      .eq('student_id', user.id)
      .in('status', ['new', 'tur', 'error'])
      .or(`next_review_date.lte.${today},next_review_date.is.null`)
      .order('next_review_date', { ascending: true })
      .limit(50);

    if (stateRows && stateRows.length > 0) {
      setQuestions(stateRows.map((s: any) => ({ ...s.questions, state: s })));
      setCurrentIndex(0);
      setHistoryStack([]);
      setIsLoading(false);
      return;
    }

    // 3. Hiç görülmemiş sorular
    await loadFreshQuestions(user.id);
    setIsLoading(false);
  }

  async function attachStates(qs: Question[], userId: string) {
    const ids = qs.map(q => q.id);
    const { data: states } = await (supabase
      .from('student_question_state') as any)
      .select('*')
      .eq('student_id', userId)
      .in('question_id', ids);

    const map = new Map((states ?? []).map((s: any) => [s.question_id, s]));
    setQuestions(qs.map(q => ({ ...q, state: (map.get(q.id) ?? null) as StudentQuestionState | null })));
    setCurrentIndex(0);
    setHistoryStack([]);
  }

  async function loadFreshQuestions(userId: string) {
    const { data: seen } = await (supabase
      .from('student_question_state') as any)
      .select('question_id')
      .eq('student_id', userId);

    const seenIds: string[] = (seen ?? []).map((s: any) => s.question_id);

    let q = (supabase.from('questions') as any)
      .select('*')
      .eq('is_active', true)
      .limit(50);

    if (seenIds.length > 0) {
      q = q.not('id', 'in', `(${seenIds.join(',')})`);
    }

    const { data: fresh } = await q;
    setQuestions((fresh ?? []).map((q: Question) => ({ ...q, state: null })));
    setCurrentIndex(0);
    setHistoryStack([]);
  }

  async function recordAttempt(answer: string, isCorrect: boolean) {
    if (!user) return;
    const q = questions[currentIndex];
    if (!q) return;

    const durationSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
    const attemptType: AttemptType =
      q.state?.status === 'tur' ? 'tur' :
      q.state?.status === 'error' ? 'error_repeat' : 'normal';

    await (supabase.from('student_attempts') as any).insert({
      student_id: user.id,
      question_id: q.id,
      answer,
      is_correct: isCorrect,
      duration_secs: durationSecs,
      attempt_type: attemptType,
    });

    const sm2 = computeSM2Update(
      q.state ?? { ease_factor: 2.5, interval_days: 1, repetition_count: 0, error_count: 0, status: 'new' as QuestionStatus },
      isCorrect,
    );

    if (q.state) {
      await (supabase.from('student_question_state') as any)
        .update(sm2)
        .eq('id', q.state.id);
    } else {
      await (supabase.from('student_question_state') as any).insert({
        student_id: user.id,
        question_id: q.id,
        ...sm2,
      });
    }
  }

  async function markAsTur() {
    if (!user) return;
    const q = questions[currentIndex];
    if (!q) return;

    if (q.state) {
      await (supabase.from('student_question_state') as any)
        .update({ status: 'tur' })
        .eq('id', q.state.id);
    } else {
      await (supabase.from('student_question_state') as any).insert({
        student_id: user.id,
        question_id: q.id,
        status: 'tur',
      });
    }
  }

  async function markAsError() {
    if (!user) return;
    const q = questions[currentIndex];
    if (!q) return;

    const errorCount = (q.state?.error_count ?? 0) + 1;
    if (q.state) {
      await (supabase.from('student_question_state') as any)
        .update({ status: 'error', error_count: errorCount })
        .eq('id', q.state.id);
    } else {
      await (supabase.from('student_question_state') as any).insert({
        student_id: user.id,
        question_id: q.id,
        status: 'error',
        error_count: errorCount,
      });
    }
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setHistoryStack(prev => [...prev, currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }
  }

  function goBack() {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack(s => s.slice(0, -1));
      setCurrentIndex(prev);
    }
  }

  return {
    currentQuestion: questions[currentIndex] ?? null,
    currentIndex,
    totalCount: questions.length,
    isLoading,
    isEmpty: !isLoading && questions.length === 0,
    canGoBack: historyStack.length > 0,
    goNext,
    goBack,
    markAsTur,
    markAsError,
    recordAttempt,
    reload: load,
  };
}
