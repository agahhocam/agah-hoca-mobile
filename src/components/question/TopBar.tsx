import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';

interface TopBarProps {
  current: number;
  total: number;
  canGoBack: boolean;
  onBack: () => void;
  onError: () => void;
}

export function TopBar({ current, total, canGoBack, onBack, onError }: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={[styles.btn, !canGoBack && styles.btnDisabled]}
        onPress={onBack}
        disabled={!canGoBack}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.btnText, !canGoBack && styles.btnTextDisabled]}>← Geri</Text>
      </TouchableOpacity>

      <View style={styles.progress}>
        <Text style={styles.progressText}>{current} / {total}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: total > 0 ? `${(current / total) * 100}%` : '0%' }]} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.errorBtn}
        onPress={onError}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.errorBtnText}>📝 Hata</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  btnDisabled: { backgroundColor: Colors.border },
  btnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  btnTextDisabled: { color: Colors.textMuted },
  progress: { flex: 1, alignItems: 'center', gap: 4 },
  progressText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  errorBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  errorBtnText: { fontSize: 14, fontWeight: '600', color: '#D97706' },
});
