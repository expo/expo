import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Tab name="index" options={{ icon: 'house' }} />
      <NativeTabs.Tab name="two" options={{ title: 'Two', icon: 'folder' }} />
      <NativeTabs.Tab name="three" options={{ title: 'Three', icon: 'trash' }} />
    </NativeTabs>
  );
}
