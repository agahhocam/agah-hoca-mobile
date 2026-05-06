import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture, GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, runOnJS,
} from 'react-native-reanimated';

import { useQuestionFeed } from '../../src/hooks/useQuestionFeed';
import { TopBar } from '../../src/components/question/TopBar';
import { QuestionContent } from '../../src/components/question/QuestionContent';
import { VerbalQuestion } from '../../src/components/question/VerbalQuestion';
import { NumericQuestion } from '../../src/components/question/NumericQuestion';
import { WrongAnswerSheet } from '../../src/components/question/WrongAnswerSheet';
import { Scratchpad } from '../../src/components/question/Scratchpad';
import { Colors } from '../../constants/Colors';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = 70;

export default function SwipeScreen() {
  const feed = useQuestionFeed();
  const [transitioning, setTransitioning] = useState(false);
  const [scratchpadVisible, setScratchpadVisible] = useState(false);
  const [wrongSheetVisible, setWrongSheetVisible] = useState(false);
  const [pendingWrongAnswer, setPendingWrongAnswer] = useState<string>('');

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // ─── Geçiş animasyonu ───────────────────────────────────────────
  const advanceCard = useCallback((direction: 'up' | 'right') => {
    if (transitioning) return;
    setTransitioning(true);
    setScratchpadVisible(false);

    const toX = direction === 'right' ? W * 1.3 : 0;
    const toY = direction === 'up' ? -H * 1.2 : 0;

    translateX.value = withTiming(toX, { duration: 260 }, () => {
      runOnJS(afterTransition)();
    });
    translateY.value = withTiming(toY, { duration: 260 });
  }, [transitioning]);

  function afterTransition() {
    feed.goNext();
    translateX.value = 0;
    translateY.value = 0;
    setTransitioning(false);
  }

  // ─── Eylemler ───────────────────────────────────────────────────
  async function handleSwipeUp() {
    advanceCard('up');
  }

  async function handleSwipeRight() {
    await feed.markAsTur();
    advanceCard('right');
  }

  async function handleErrorButton() {
    await feed.markAsError();
    advanceCard('up');
  }

  // ─── Cevap işlemleri ────────────────────────────────────────────
  async function handleVerbalAnswer(answer: string, isCorrect: boolean) {
    await feed.recordAttempt(answer, isCorrect);
    advanceCard('up');
  }

  async function handleNumericCorrect(answer: string) {
    await feed.recordAttempt(answer, true);
    advanceCard('up');
  }

  function handleNumericWrong(answer: string) {
    setPendingWrongAnswer(answer);
    setWrongSheetVisible(true);
  }

  async function handleSheetRetry() {
    setWrongSheetVisible(false);
    setPendingWrongAnswer('');
  }

  async function handleSheetTur() {
    setWrongSheetVisible(false);
    await feed.recordAttempt(pendingWrongAnswer, false);
    await feed.markAsTur();
    advanceCard('right');
  }

  async function handleSheetError() {
    setWrongSheetVisible(false);
    await feed.recordAttempt(pendingWrongAnswer, false);
    await feed.markAsError();
    advanceCard('up');
  }

  // ─── Swipe gesture ──────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate(e => {
      if (transitioning || wrongSheetVisible || scratchpadVisible) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(e => {
      if (transitioning || wrongSheetVisible || scratchpadVisible) return;

      const dy = e.translationY;
      const dx = e.translationX;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (dy < -SWIPE_THRESHOLD && absY > absX) {
        runOnJS(handleSwipeUp)();
      } else if (dx > SWIPE_THRESHOLD && absX > absY) {
        runOnJS(handleSwipeRight)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = (translateX.value / W) * 12;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // ─── Swipe indicator opacity ────────────────────────────────────
  const upHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, -translateY.value / (SWIPE_THRESHOLD * 1.5))),
  }));
  const rightHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, translateX.value / (SWIPE_THRESHOLD * 1.5))),
  }));

  // ─── Render ─────────────────────────────────────────────────────
  if (feed.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Sorular yükleniyor...</Text>
      </View>
    );
  }

  if (feed.isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyTitle}>Bugünlük hepsi bu kadar!</Text>
        <Text style={styles.emptySubtitle}>Tüm soruları tamamladın.</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={feed.reload}>
          <Text style={styles.reloadBtnText}>Yenile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!feed.currentQuestion) return null;

  const q = feed.currentQuestion;
  const isLastQuestion = feed.currentIndex === feed.totalCount - 1;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <TopBar
        current={feed.currentIndex + 1}
        total={feed.totalCount}
        canGoBack={feed.canGoBack}
        onBack={feed.goBack}
        onError={handleErrorButton}
      />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Swipe indicators */}
          <Animated.View style={[styles.hintBadge, styles.hintUp, upHintStyle]}>
            <Text style={styles.hintText}>↑ Sonraki</Text>
          </Animated.View>
          <Animated.View style={[styles.hintBadge, styles.hintRight, rightHintStyle]}>
            <Text style={styles.hintText}>→ Turla</Text>
          </Animated.View>

          {/* Soru içeriği */}
          <QuestionContent
            question={q}
            statusBadge={q.state?.status ?? null}
          />

          {/* Cevaplama arayüzü */}
          {q.question_type === 'verbal' ? (
            <VerbalQuestion
              question={q}
              onAnswer={handleVerbalAnswer}
              disabled={transitioning}
            />
          ) : (
            <NumericQuestion
              question={q}
              onCorrectAnswer={handleNumericCorrect}
              onWrongAnswer={handleNumericWrong}
              disabled={transitioning}
            />
          )}

          {/* Scratchpad overlay */}
          <Scratchpad visible={scratchpadVisible} onToggle={() => setScratchpadVisible(v => !v)} />
        </Animated.View>
      </GestureDetector>

      {/* Alt eylem çubuğu */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          {/* Scratchpad toggle buraya taşındı — Scratchpad komponenti kendi toggle butonunu render ediyor */}
        </View>
        <View style={styles.swipeHints}>
          {!isLastQuestion && (
            <Text style={styles.swipeHintText}>↑ Sonraki   →  İkinci Tur</Text>
          )}
        </View>
      </View>

      {/* Yanlış cevap bottom sheet (sayısal) */}
      <WrongAnswerSheet
        visible={wrongSheetVisible}
        onRetry={handleSheetRetry}
        onTur={handleSheetTur}
        onError={handleSheetError}
        onClose={() => setWrongSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 15, color: Colors.textMuted },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  emptySubtitle: { fontSize: 15, color: Colors.textMuted },
  reloadBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  reloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    margin: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },

  hintBadge: {
    position: 'absolute',
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintUp: {
    top: 16,
    alignSelf: 'center',
    left: '35%',
    backgroundColor: Colors.primary,
  },
  hintRight: {
    right: 16,
    top: '45%',
    backgroundColor: '#7C3AED',
  },
  hintText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomLeft: { flex: 1 },
  swipeHints: { flex: 2, alignItems: 'center' },
  swipeHintText: { fontSize: 12, color: Colors.textMuted },
});
