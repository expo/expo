import { Slot, Tabs } from 'expo-router';

export default function Layout() {
  // if (process.env.EXPO_OS === 'web')
  return <Slot />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
