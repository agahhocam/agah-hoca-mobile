import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Merhaba, {profile?.nickname ?? 'öğrenci'}!
      </Text>
      <Text style={styles.subtitle}>
        Bugünkü paket yükleniyor...
      </Text>
      <Text style={styles.note}>
        Swipe ekranı Faz 2'de geliyor.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: Colors.textMuted, marginBottom: 8 },
  note: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
});
