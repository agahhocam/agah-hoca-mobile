import type { QuestionStatus } from '../types/database';

interface SM2State {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  error_count: number;
  status: QuestionStatus;
}

interface SM2Update {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  error_count: number;
  status: QuestionStatus;
  last_review_date: string;
  next_review_date: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function computeSM2Update(state: SM2State, isCorrect: boolean): SM2Update {
  const { ease_factor, interval_days, repetition_count, error_count, status } = state;

  if (isCorrect) {
    let newInterval: number;
    if (repetition_count === 0) newInterval = 1;
    else if (repetition_count === 1) newInterval = 6;
    else newInterval = Math.round(interval_days * ease_factor);

    const newEF = Math.min(Math.max(ease_factor + 0.1, 1.3), 3.0);
    const newRepCount = repetition_count + 1;

    // Arşivleme: error durumunda 2+ hata veya 7+ gün aralıkta doğru yapıldıysa
    let newStatus: QuestionStatus = 'completed';
    if (status === 'error' && (error_count >= 2 || newInterval >= 7)) {
      newStatus = 'archived';
    } else if (status === 'tur') {
      newStatus = 'tur'; // tur durumundan ancak tamamlandığında çıkar
    }

    return {
      ease_factor: newEF,
      interval_days: newInterval,
      repetition_count: newRepCount,
      error_count,
      status: newStatus,
      last_review_date: todayStr(),
      next_review_date: addDays(newInterval),
    };
  } else {
    return {
      ease_factor: Math.max(ease_factor - 0.2, 1.3),
      interval_days: 1,
      repetition_count: 0,
      error_count: error_count + 1,
      status: 'error',
      last_review_date: todayStr(),
      next_review_date: addDays(1),
    };
  }
}
