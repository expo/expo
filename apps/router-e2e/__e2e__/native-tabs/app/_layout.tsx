import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Badge, Icon, Title } from 'expo-router';
import { NativeTabs } from 'expo-router/build/ui/NativeBottomTabs/NativeBottomTabsNavigator';
import { AndroidIcon, IOSIcon } from 'expo-router/build/ui/NativeBottomTabs/NavigatorElements';
import { Appearance, Platform } from 'react-native';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('dark');
}

export default function Layout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs
        style={{
          // fontSize: 16,
          // fontWeight: 700,
          // fontStyle: 'italic',
          // fontFamily: 'Courier New',
          backgroundColor: Platform.OS === 'android' ? 'black' : undefined,
          // badgeBackgroundColor: 'green',
          // color: 'blue',
          tintColor: 'orange',
          blurEffect: 'systemChromeMaterial',
          labelVisibilityMode: 'auto',
          rippleColor: 'orange',
          iconColor: Platform.OS === 'android' ? '#888' : undefined,
          color: Platform.OS === 'android' ? '#888' : undefined,
          '&:active': {
            fontSize: 14,
            indicatorColor: 'black',
          },
        }}
        minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger
          name="index"
          options={{
            icon: { sfSymbolName: 'applewatch.side.right' },
            iconResourceName: 'ic_phone',
            title: 'My Watch',
          }}
        />
        <NativeTabs.Trigger name="faces" options={{ title: 'Face Gallery' }} popToRoot>
          <IOSIcon name="lock.applewatch" />
          <IOSIcon name="lock.open.applewatch" useAsSelected />
          <AndroidIcon name="ic_lock_open" />
          <Title>Face Gallery</Title>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="four">
          <Icon src={require('../../../assets/explore_gray.png')} />
          <Icon src={require('../../../assets/explore_orange.png')} useAsSelected />
          <IOSIcon name="safari.fill" />
          <IOSIcon name="safari.fill" useAsSelected />
          <AndroidIcon name="ic_search" />
          <Badge>9+</Badge>
          <Title>Discover</Title>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
