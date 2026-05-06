import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Question } from '../../types/database';
import { Colors } from '../../../constants/Colors';

interface VerbalQuestionProps {
  question: Question;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  disabled?: boolean;
}

type ChoiceState = 'idle' | 'pending' | 'correct' | 'incorrect' | 'revealed';

export function VerbalQuestion({ question, onAnswer, disabled = false }: VerbalQuestionProps) {
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  const [choiceStates, setChoiceStates] = useState<Record<string, ChoiceState>>({});
  const [answered, setAnswered] = useState(false);

  const choiceKeys = ['A', 'B', 'C', 'D', 'E'].slice(0, question.choices_count ?? 4);

  const handleTap = useCallback((key: string) => {
    if (disabled || answered) return;

    if (pendingChoice === key) {
      // İkinci dokunuş aynı şıkka — cevabı onayla
      const isCorrect = key === question.correct_answer;
      setAnswered(true);

      const newStates: Record<string, ChoiceState> = {};
      choiceKeys.forEach(k => {
        if (k === key) newStates[k] = isCorrect ? 'correct' : 'incorrect';
        else if (!isCorrect && k === question.correct_answer) newStates[k] = 'revealed';
        else newStates[k] = 'idle';
      });
      setChoiceStates(newStates);

      if (isCorrect) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      const delay = isCorrect ? 800 : 1200;
      setTimeout(() => {
        onAnswer(key, isCorrect);
        // reset için parent yeni soruyu yükleyecek
        setPendingChoice(null);
        setChoiceStates({});
        setAnswered(false);
      }, delay);
    } else {
      // İlk dokunuş veya farklı şık
      setPendingChoice(key);
      const newStates: Record<string, ChoiceState> = {};
      choiceKeys.forEach(k => {
        newStates[k] = k === key ? 'pending' : 'idle';
      });
      setChoiceStates(newStates);
    }
  }, [pendingChoice, answered, disabled, question, choiceKeys]);

  return (
    <View style={styles.container}>
      {pendingChoice && !answered && (
        <Text style={styles.hint}>Onaylamak için tekrar dokun</Text>
      )}
      {choiceKeys.map(key => {
        const state = choiceStates[key] ?? 'idle';
        const text = question.choices?.[key] ?? '';
        return (
          <TouchableOpacity
            key={key}
            style={[styles.choice, choiceStyle(state)]}
            onPress={() => handleTap(key)}
            activeOpacity={0.7}
            disabled={answered}
          >
            <View style={[styles.keyBadge, keyBadgeStyle(state)]}>
              <Text style={[styles.keyText, keyTextStyle(state)]}>{key}</Text>
            </View>
            <Text style={[styles.choiceText, choiceTextStyle(state)]} numberOfLines={3}>
              {text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function choiceStyle(state: ChoiceState) {
  switch (state) {
    case 'pending':   return { borderColor: Colors.primary, backgroundColor: Colors.primaryLight };
    case 'correct':   return { borderColor: Colors.success, backgroundColor: '#DCFCE7' };
    case 'incorrect': return { borderColor: Colors.danger,  backgroundColor: '#FEE2E2' };
    case 'revealed':  return { borderColor: Colors.success, backgroundColor: '#DCFCE7' };
    default:          return {};
  }
}

function keyBadgeStyle(state: ChoiceState) {
  switch (state) {
    case 'pending':   return { backgroundColor: Colors.primary };
    case 'correct':   return { backgroundColor: Colors.success };
    case 'incorrect': return { backgroundColor: Colors.danger };
    case 'revealed':  return { backgroundColor: Colors.success };
    default:          return { backgroundColor: Colors.border };
  }
}

function keyTextStyle(state: ChoiceState) {
  return state !== 'idle' ? { color: '#fff' } : { color: Colors.textSecondary };
}

function choiceTextStyle(state: ChoiceState) {
  switch (state) {
    case 'correct':
    case 'revealed': return { color: '#166534' };
    case 'incorrect': return { color: '#991B1B' };
    case 'pending':  return { color: Colors.primary };
    default:         return {};
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  hint: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  keyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  keyText: { fontSize: 13, fontWeight: '800' },
  choiceText: { flex: 1, fontSize: 15, color: Colors.text, lineHeight: 21 },
});
