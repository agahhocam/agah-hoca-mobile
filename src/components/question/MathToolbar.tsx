import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../../constants/Colors';

const SYMBOLS = [
  { label: '½', insert: '1/2' },
  { label: '√', insert: '√' },
  { label: 'xⁿ', insert: '^' },
  { label: 'π',  insert: 'π' },
  { label: 'x/y', insert: '/' },
  { label: 'a²', insert: '^2' },
  { label: 'a³', insert: '^3' },
  { label: '∞', insert: '∞' },
];

interface MathToolbarProps {
  onInsert: (symbol: string) => void;
}

export function MathToolbar({ onInsert }: MathToolbarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {SYMBOLS.map(s => (
        <TouchableOpacity
          key={s.label}
          style={styles.btn}
          onPress={() => onInsert(s.insert)}
        >
          <Text style={styles.btnText}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 48 },
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 40,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
});
