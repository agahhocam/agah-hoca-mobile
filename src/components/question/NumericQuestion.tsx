import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Question } from '../../types/database';
import { MathToolbar } from './MathToolbar';
import { Colors } from '../../../constants/Colors';

interface NumericQuestionProps {
  question: Question;
  onCorrectAnswer: (answer: string) => void;
  onWrongAnswer: (answer: string) => void;
  disabled?: boolean;
}

export function NumericQuestion({
  question, onCorrectAnswer, onWrongAnswer, disabled = false,
}: NumericQuestionProps) {
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'correct' | null>(null);
  const inputRef = useRef<TextInput>(null);

  function handleInsert(symbol: string) {
    setValue(prev => prev + symbol);
    inputRef.current?.focus();
  }

  async function handleSubmit() {
    if (!value.trim() || disabled || checking) return;

    setChecking(true);
    const isCorrect = value.trim() === question.correct_answer.trim();

    if (isCorrect) {
      setResult('correct');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        onCorrectAnswer(value.trim());
        setValue('');
        setResult(null);
        setChecking(false);
      }, 800);
    } else {
      setChecking(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onWrongAnswer(value.trim());
    }
  }

  function resetInput() {
    setValue('');
    setResult(null);
    setChecking(false);
    inputRef.current?.focus();
  }

  return (
    <View style={styles.container}>
      <MathToolbar onInsert={handleInsert} />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, result === 'correct' && styles.inputCorrect]}
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          placeholder="Cevabını yaz..."
          placeholderTextColor={Colors.textMuted}
          editable={!disabled && !result}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.submitBtn, (!value.trim() || disabled || !!result) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!value.trim() || disabled || !!result}
        >
          {checking
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.submitBtnText}>{result === 'correct' ? '✓' : '→'}</Text>
          }
        </TouchableOpacity>
      </View>

      {result === 'correct' && (
        <View style={styles.correctBanner}>
          <Text style={styles.correctText}>Doğru! 🎉</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  inputRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: Colors.text,
    backgroundColor: Colors.surface,
    fontWeight: '600',
  },
  inputCorrect: { borderColor: Colors.success, backgroundColor: '#DCFCE7' },
  submitBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  correctBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    alignItems: 'center',
  },
  correctText: { fontSize: 16, fontWeight: '700', color: '#166534' },
});
