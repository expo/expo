import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform } from 'react-native';

import { ActiveTabsContext } from '../utils/active-tabs-context';

Appearance.setColorScheme('dark');

export default function Layout() {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  return (
    <ThemeProvider value={DarkTheme}>
      <ActiveTabsContext.Provider value={{ activeTabs, setActiveTabs }}>
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
              icon: { sf: 'applewatch.side.right', drawable: 'ic_phone' },
              title: 'My Watch',
            }}
          />
          <NativeTabs.Trigger name="faces" options={{ title: 'Face Gallery' }}>
            <Icon sf="lock.applewatch" selectedSf="lock.open.applewatch" drawable="ic_lock_open" />
            <Label>Face Gallery</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="four">
            <Icon
              src={require('../../../assets/explore_gray.png')}
              selectedSrc={require('../../../assets/explore_orange.png')}
              // sf="safari"
              drawable="ic_search"
            />
            <Badge>9+</Badge>
            <Label>Discover</Label>
          </NativeTabs.Trigger>
          {activeTabs.map((tab) => (
            <NativeTabs.Trigger key={tab} name={tab}>
              <Icon sf="plus" drawable="ic_search" />
            </NativeTabs.Trigger>
          ))}
        </NativeTabs>
      </ActiveTabsContext.Provider>
    </ThemeProvider>
  );
}
