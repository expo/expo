import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Badge, Icon, Title } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';
import { IOSIcon } from 'expo-router/build/ui/NativeBottomTabs/NavigatorElements';
import { Appearance } from 'react-native';

Appearance.setColorScheme('dark');

export default function Layout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs
        style={{
          // fontSize: 16,
          // fontWeight: 700,
          // fontStyle: 'italic',
          // fontFamily: 'Courier New',
          // backgroundColor: 'rgba(255,255,255, 0.5)',
          // badgeBackgroundColor: 'green',
          // color: 'blue',
          tintColor: 'orange',
          blurEffect: 'systemChromeMaterial',
        }}>
        <NativeTabs.Trigger
          name="index"
          options={{
            icon: { sfSymbolName: 'applewatch.side.right' },
            title: 'My Watch',
          }}
        />
        <NativeTabs.Trigger name="faces" options={{ title: 'Face Gallery' }} popToRoot>
          <IOSIcon name="lock.applewatch" />
          <IOSIcon name="lock.open.applewatch" useAsSelected />
          <Title>Face Gallery</Title>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="four">
          <Icon src={require('../../../assets/explore_gray.png')} />
          <Icon src={require('../../../assets/explore_orange.png')} useAsSelected />
          <IOSIcon name="safari.fill" />
          <IOSIcon name="safari.fill" useAsSelected />
          <Badge>9+</Badge>
          <Title>Discover</Title>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
