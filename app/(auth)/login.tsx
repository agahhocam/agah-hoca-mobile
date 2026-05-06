import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const emailErr = validateEmail(email);
    if (emailErr) return Alert.alert('Hata', emailErr);
    const passErr = validatePassword(password);
    if (passErr) return Alert.alert('Hata', passErr);

    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) Alert.alert('Giriş Başarısız', error);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>agah hoca</Text>
        <Text style={styles.subtitle}>Eğitim Koçum</Text>

        <View style={styles.form}>
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
            placeholder="••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Giriş Yap</Text>
            }
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>Hesabın yok mu? <Text style={styles.linkBold}>Kayıt ol</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  brand: { fontSize: 36, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 40 },
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
