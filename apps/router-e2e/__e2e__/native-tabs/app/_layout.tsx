import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

const TabsWrapper = NativeTabs;
// const TabsWrapper = Tabs;

export default function Layout() {
  return (
    <TabsWrapper>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="two" />
      <Tabs.Screen name="hidden" />
      <Tabs.Screen name="three" />
    </TabsWrapper>
  );
}
