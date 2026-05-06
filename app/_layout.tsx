import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // Oturum yoksa login'e yönlendir
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (!profile) {
      // Oturum var ama profil yok: avatar setup'a yönlendir
      if (segments[0] !== '(auth)') router.replace('/(auth)/avatar-setup');
    } else {
      // Tam oturum + profil: ana uygulamaya yönlendir
      if (inAuthGroup) router.replace('/(app)');
    }
  }, [session, profile, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
