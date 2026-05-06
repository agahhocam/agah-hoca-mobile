import { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Pressable, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';

const SHEET_HEIGHT = 300;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WrongAnswerSheetProps {
  visible: boolean;
  onRetry: () => void;
  onTur: () => void;
  onError: () => void;
  onClose: () => void;
}

export function WrongAnswerSheet({ visible, onRetry, onTur, onError, onClose }: WrongAnswerSheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
      backdropOpacity.value = withTiming(0.5, { duration: 200 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle} />

        <Text style={styles.title}>Bir işlem hatası yapmış olabilir misin?</Text>
        <Text style={styles.subtitle}>Nasıl devam etmek istersin?</Text>

        <TouchableOpacity style={[styles.option, styles.retryOption]} onPress={onRetry}>
          <Text style={styles.optionEmoji}>🔁</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Tekrar Dene</Text>
            <Text style={styles.optionDesc}>Giriş sıfırlanır, hesabı kontrol edebilirsin</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, styles.turOption]} onPress={onTur}>
          <Text style={styles.optionEmoji}>🔄</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Turlamaya Bırak</Text>
            <Text style={styles.optionDesc}>İkinci turda tekrar karşına çıkacak</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, styles.errorOption]} onPress={onError}>
          <Text style={styles.optionEmoji}>📝</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Hata Defterine Gönder</Text>
            <Text style={styles.optionDesc}>SM-2 tekrar planına eklenecek</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: -4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  retryOption:  { borderColor: Colors.primary,   backgroundColor: Colors.primaryLight },
  turOption:    { borderColor: '#7C3AED',         backgroundColor: '#EDE9FE' },
  errorOption:  { borderColor: Colors.warning,    backgroundColor: '#FEF3C7' },
  optionEmoji: { fontSize: 24 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  optionDesc:  { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
