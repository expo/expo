import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { Badge, Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform } from 'react-native';

import { ActiveTabsContext } from '../utils/active-tabs-context';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('dark');
}

export default function Layout() {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  return (
    <ThemeProvider value={DarkTheme}>
      <ActiveTabsContext.Provider value={{ activeTabs, setActiveTabs }}>
        <NativeTabs
          // Both platforms
          labelStyle={{
            fontSize: 16,
            fontWeight: 700,
            fontStyle: 'italic',
            fontFamily: 'monospace',
            color: Platform.OS === 'android' ? '#888' : undefined,
          }}
          backgroundColor={Platform.OS === 'android' ? 'black' : undefined}
          badgeBackgroundColor="green"
          tintColor="orange"
          iconColor={Platform.OS === 'android' ? '#888' : undefined}
          // iOS only
          blurEffect="systemDefault"
          minimizeBehavior="onScrollDown"
          // Android only
          labelVisibilityMode="auto"
          rippleColor="orange"
          indicatorColor="black">
          {/* iOS only */}
          <NativeTabs.ScrollEdgeAppearance
            ios26LabelStyle={{
              fontSize: 8,
              fontWeight: 100,
              fontStyle: 'italic',
              fontFamily: 'Courier New',
              color: 'white',
            }}
            ios26IconColor="#f00"
            blurEffect="none"
            backgroundColor={null}
            ios26BadgeBackgroundColor="#00f"
          />
          <NativeTabs.Trigger name="index">
            <Label>My Watch</Label>
            <Icon
              selectedColor={{ standard: '#f00', scrollEdge: '#0f0' }}
              sf="applewatch.side.right"
              drawable="ic_phone"
            />
          </NativeTabs.Trigger>
          {activeTabs.map((tab) => (
            <NativeTabs.Trigger key={tab} name={tab}>
              <Icon sf="plus" drawable="ic_search" />
              <Badge selectedBackgroundColor={{ scrollEdge: '#ff0', standard: '#00f' }} />
            </NativeTabs.Trigger>
          ))}
          <NativeTabs.Trigger name="faces">
            {/* <TabBar
              // Styles applied to the whole tab bar when this tab is selected
              backgroundColor
              blurEffect
              iconColor
            /> */}
            <Icon
              selectedColor="#f00"
              sf={{
                default: 'lock.applewatch',
                selected: 'lock.open.applewatch',
              }}
              drawable="ic_lock_open"
            />
            <Label hidden />
            <Badge selectedBackgroundColor={{ scrollEdge: '#ff0', standard: '#00f' }}>1</Badge>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="explore" role="search">
            <Icon sf="magnifyingglass" drawable="ic_search" />
            <Label selectedStyle={{ fontSize: 32, color: '#f00' }}>Search</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="dynamic">
            <Icon sf="figure.disc.sports" drawable="ic_menu" />
            <Badge>9</Badge>
            <Label>Dynamic</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </ActiveTabsContext.Provider>
    </ThemeProvider>
  );
}
