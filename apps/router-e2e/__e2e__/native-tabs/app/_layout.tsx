import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

export default function Layout() {
  return (
    <NativeTabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="two" />
      <Tabs.Screen name="three" options={{ href: '/three/apple' }} />
    </NativeTabs>
  );
}
