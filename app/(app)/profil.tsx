import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function ProfilScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>{profile?.avatar_url ?? '🦉'}</Text>
      <Text style={styles.nickname}>{profile?.nickname}</Text>
      <Text style={styles.xp}>XP: {profile?.xp ?? 0}</Text>
      <Text style={styles.streak}>Seri: {profile?.streak_count ?? 0} gün</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { fontSize: 72, marginBottom: 16 },
  nickname: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  xp: { fontSize: 16, color: Colors.textMuted, marginBottom: 4 },
  streak: { fontSize: 16, color: Colors.textMuted, marginBottom: 40 },
  logoutBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.danger },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
