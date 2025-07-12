import { Icon, Title } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Tab name="index" options={{ iconSFSymbolName: 'house' }} />
      <NativeTabs.Tab name="two" options={{ title: 'Two' }}>
        <Icon sfSymbolName="star" />
      </NativeTabs.Tab>
      <NativeTabs.Tab name="three">
        <Icon sfSymbolName="gear" />
        <Title style={{ fontFamily: 'Courier', fontSize: 20, fontWeight: 'bold' }}>Three</Title>
      </NativeTabs.Tab>
      <NativeTabs.Tab name="four">
        <Icon sfSymbolName="globe" />
        <Title style={{ fontFamily: 'Courier', fontSize: 5, fontWeight: 100 }}>Four</Title>
      </NativeTabs.Tab>
    </NativeTabs>
  );
}
