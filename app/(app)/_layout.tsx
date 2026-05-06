import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Çöz', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="hata-defteri"
        options={{ title: 'Hatalar', tabBarIcon: ({ color }) => <TabIcon emoji="📝" color={color} /> }}
      />
      <Tabs.Screen
        name="istatistik"
        options={{ title: 'İstatistik', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
