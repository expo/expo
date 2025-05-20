import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Tab name="index" options={{ icon: 'house' }} />
      <NativeTabs.Tab name="two" options={{ label: 'Two', icon: 'folder' }} />
      <NativeTabs.Tab name="three" options={{ label: 'Three', icon: 'trash' }} />
    </NativeTabs>
  );
}
