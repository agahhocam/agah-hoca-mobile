import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { validateNickname } from '../../src/utils/validation';
import { AVATARS } from '../../constants/avatars';
import { Colors } from '../../constants/Colors';

export default function AvatarSetupScreen() {
  const { user, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    const nicknameErr = validateNickname(nickname);
    if (nicknameErr) return Alert.alert('Hata', nicknameErr);
    if (!selectedAvatar) return Alert.alert('Hata', 'Lütfen bir avatar seçiniz.');
    if (!user) return;

    setLoading(true);

    // Nickname benzersizlik kontrolü
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname.trim())
      .single();

    if (existing) {
      setLoading(false);
      return Alert.alert('Hata', 'Bu kullanıcı adı zaten kullanılıyor. Başka bir tane dene.');
    }

    const avatar = AVATARS.find((a) => a.id === selectedAvatar);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any).insert({
      id: user.id,
      real_name: user.user_metadata?.real_name ?? '',
      nickname: nickname.trim(),
      avatar_url: avatar?.emoji ?? null,
      role: 'student',
      daily_target: 50,
      xp: 0,
      streak_count: 0,
    });

    setLoading(false);
    if (error) return Alert.alert('Hata', error.message);

    await refreshProfile();
    // AuthContext artık ana uygulamaya yönlendirir
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Profilini Oluştur</Text>
      <Text style={styles.subtitle}>Diğer öğrenciler seni bu adla tanıyacak.</Text>

      <Text style={styles.label}>Kullanıcı Adı</Text>
      <TextInput
        style={styles.input}
        placeholder="kahraman_42"
        placeholderTextColor={Colors.textMuted}
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />
      <Text style={styles.hint}>3-20 karakter, harf/rakam/alt çizgi. Gerçek adın görünmez.</Text>

      <Text style={[styles.label, { marginTop: 24 }]}>Avatarını Seç</Text>
      <FlatList
        data={AVATARS}
        keyExtractor={(item) => item.id}
        numColumns={5}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.avatarBtn, selectedAvatar === item.id && styles.avatarSelected]}
            onPress={() => setSelectedAvatar(item.id)}
          >
            <Text style={styles.avatarEmoji}>{item.emoji}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.avatarGrid}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Hazırım, Başlayalım!</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  avatarGrid: { gap: 10 },
  avatarBtn: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  avatarEmoji: { fontSize: 28 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
