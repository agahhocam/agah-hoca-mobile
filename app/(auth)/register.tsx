import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!realName.trim()) return Alert.alert('Hata', 'Lütfen adınızı giriniz.');
    const emailErr = validateEmail(email);
    if (emailErr) return Alert.alert('Hata', emailErr);
    const passErr = validatePassword(password);
    if (passErr) return Alert.alert('Hata', passErr);
    if (password !== passwordConfirm) return Alert.alert('Hata', 'Şifreler eşleşmiyor.');

    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password, realName.trim());
    setLoading(false);
    if (error) Alert.alert('Kayıt Başarısız', error);
    // Başarılıysa AuthContext avatar-setup'a yönlendirir
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>agah hoca</Text>
        <Text style={styles.subtitle}>Yeni Hesap Oluştur</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Adınız Soyadınız</Text>
          <TextInput
            style={styles.input}
            placeholder="Ali Yılmaz"
            placeholderTextColor={Colors.textMuted}
            value={realName}
            onChangeText={setRealName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="En az 6 karakter"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Şifre Tekrar</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifreyi tekrar girin"
            placeholderTextColor={Colors.textMuted}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Devam Et</Text>
            }
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Zaten hesabın var mı? <Text style={styles.linkBold}>Giriş yap</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  brand: { fontSize: 36, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 32 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 8 },
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
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: 15, color: Colors.textMuted },
  linkBold: { color: Colors.primary, fontWeight: '700' },
});
