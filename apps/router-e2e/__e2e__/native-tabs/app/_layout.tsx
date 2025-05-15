import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

const TabsWrapper = NativeTabs;
// const TabsWrapper = Tabs;

export default function Layout() {
  return (
    <TabsWrapper>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="two" />
      <Tabs.Screen name="hidden" options={{ href: null }} />
      <Tabs.Screen name="three" options={{ href: '/three/apple' }} />
    </TabsWrapper>
  );
}
