import MIcons from '@expo/vector-icons/MaterialIcons';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Badge, Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { ActiveTabsContext } from '../utils/active-tabs-context';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('unspecified');
}

export default function Layout() {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActiveTabsContext.Provider value={{ activeTabs, setActiveTabs }}>
        <NativeTabs
        // Both platforms
        // labelStyle={{
        //   fontSize: 16,
        //   fontWeight: 700,
        //   fontStyle: 'italic',
        //   // fontFamily: 'Courier New',
        //   color: Platform.OS === 'android' ? '#888' : undefined,
        // }}
        // backgroundColor={Platform.OS === 'android' ? 'black' : undefined}
        // badgeBackgroundColor="green"
        // tintColor="orange"
        // iconColor={Platform.OS === 'android' ? '#888' : undefined}
        // iOS only
        // blurEffect="systemChromeMaterial"
        // minimizeBehavior="onScrollDown"
        // disableTransparentOnScrollEdge
        // Android only
        // labelVisibilityMode="auto"
        // rippleColor="orange"
        // indicatorColor="black"
        >
          <NativeTabs.Trigger name="index">
            <Label
            // selectedStyle={{ color: '#0f0' }}
            >
              My Watch
            </Label>
            <Icon
              // selectedColor="deepNavy"
              sf="applewatch.side.right"
              drawable="ic_phone"
            />
          </NativeTabs.Trigger>
          {activeTabs.map((tab, index) => (
            <NativeTabs.Trigger
              key={tab}
              name={tab}
              role={index === 0 ? 'search' : undefined}
              addIOSSafeInsets>
              <Icon sf="plus" drawable="ic_search" />
              <Badge
              // selectedBackgroundColor="#ff0"
              />
            </NativeTabs.Trigger>
          ))}
          <NativeTabs.Trigger name="faces">
            <NativeTabs.Trigger.TabBar
            // labelStyle={{
            //   fontSize: 32,
            //   fontWeight: '900',
            //   color: 'white',
            // }}
            // badgeBackgroundColor="white"
            // backgroundColor="blue"
            // blurEffect="light"
            // iconColor="red"
            // indicatorColor="white"
            />
            <Icon
              // selectedColor="#f00"
              sf={{
                default: 'lock.applewatch',
                selected: 'lock.open.applewatch',
              }}
              drawable="ic_lock_open"
            />
            <Label hidden />
            <Badge>1</Badge>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="explore">
            {Platform.OS !== 'web' && (
              <Icon src={<VectorIcon family={MIcons} name="compass-calibration" />} />
            )}
            <Label>Explore</Label>
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
