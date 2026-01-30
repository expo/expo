import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="apis"
        options={{
          title: 'APIs',
          tabBarIcon: ({ color }) => <Feather name="code" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
