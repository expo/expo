import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Tab name="index" options={{ label: 'Index@@' }} />
      <NativeTabs.Tab name="two" options={{ label: 'TWOO' }} />
      <NativeTabs.Tab name="three" options={{ label: 'Three' }} />
    </NativeTabs>
  );
}
