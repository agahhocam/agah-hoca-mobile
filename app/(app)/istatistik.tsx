import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function IstatistikScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>İstatistikler</Text>
      <Text style={styles.sub}>Performans grafikleri burada olacak. (Faz 6)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  sub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
