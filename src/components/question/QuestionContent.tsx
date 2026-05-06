import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import type { Question } from '../../types/database';
import { Colors } from '../../../constants/Colors';

interface QuestionContentProps {
  question: Question;
  statusBadge?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  tur:   { label: '🔄 İkinci Tur', color: '#7C3AED', bg: '#EDE9FE' },
  error: { label: '📝 Hata Defteri', color: '#DC2626', bg: '#FEE2E2' },
};

export function QuestionContent({ question, statusBadge }: QuestionContentProps) {
  const badge = statusBadge ? STATUS_LABELS[statusBadge] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      )}

      <Text style={styles.questionText} selectable={false}>
        {question.content}
      </Text>

      {question.image_url && (
        <Image
          source={{ uri: question.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  questionText: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.text,
    fontWeight: '400',
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 16,
    borderRadius: 8,
  },
});
