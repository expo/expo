import { Title } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';
import { IOSIcon } from 'expo-router/build/ui/NativeBottomTabs/NavigatorElements';
import { Appearance } from 'react-native';

Appearance.setColorScheme('dark');

export default function Layout() {
  return (
    <NativeTabs
      style={{
        tintColor: 'orange',
        blurEffect: 'systemChromeMaterial',
      }}>
      <NativeTabs.Trigger name="index">
        <IOSIcon name="light.beacon.max" />
        <Title>All</Title>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="news">
        <IOSIcon name="newspaper.fill" />
        <Title>News</Title>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
