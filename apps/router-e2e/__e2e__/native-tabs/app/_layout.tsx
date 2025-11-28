import MIcons from '@expo/vector-icons/MaterialIcons';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { MiniPlayer } from '../components/mini-player';
import { ActiveTabsContext } from '../utils/active-tabs-context';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('unspecified');
}

export default function Layout() {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActiveTabsContext.Provider value={{ activeTabs, setActiveTabs }}>
        <NativeTabs
          // Both platforms
          // labelStyle={{
          //   default: {
          //     fontSize: 16,
          //     fontWeight: 700,
          //     fontStyle: 'italic',
          //     // fontFamily: 'Courier New',
          //     color: Platform.OS === 'android' ? '#888' : undefined,
          //   },
          //   selected: {
          //     fontSize: 32,
          //     color: 'red',
          //   },
          // }}
          // backgroundColor={Platform.OS === 'android' ? 'black' : undefined}
          // badgeBackgroundColor="green"
          // tintColor="orange"
          // iconColor={Platform.OS === 'android' ? '#888' : { selected: 'purple' }}
          // iOS only
          // blurEffect="systemChromeMaterial"
          minimizeBehavior="onScrollDown"
          // disableTransparentOnScrollEdge
          // Android only
          // labelVisibilityMode="auto"
          // rippleColor="orange"
          // indicatorColor="black"
          // sidebarAdaptable
        >
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label
            // selectedStyle={{ color: '#0f0' }}
            >
              My Watch
            </NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              // selectedColor="deepNavy"
              sf="applewatch.side.right"
              md="watch"
            />
          </NativeTabs.Trigger>
          {activeTabs.map((tab, index) => (
            <NativeTabs.Trigger key={tab} name={tab} role={index === 0 ? 'search' : undefined}>
              <NativeTabs.Trigger.Icon sf="plus" drawable="ic_search" />
              <NativeTabs.Trigger.Badge
              // selectedBackgroundColor="#ff0"
              />
            </NativeTabs.Trigger>
          ))}
          <NativeTabs.Trigger name="faces">
            <NativeTabs.Trigger.Icon
              // selectedColor="#f00"
              sf={{
                default: 'lock.applewatch',
                selected: 'lock.open.applewatch',
              }}
              drawable="ic_lock_open"
            />
            <NativeTabs.Trigger.Label style={{ display: 'none' }} />
            <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="explore">
            {Platform.OS !== 'web' && (
              <NativeTabs.Trigger.Icon
                src={<VectorIcon family={MIcons} name="compass-calibration" />}
              />
            )}
            <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="dynamic">
            <NativeTabs.Trigger.Icon sf="figure.disc.sports" drawable="ic_menu" />
            <NativeTabs.Trigger.Badge>9</NativeTabs.Trigger.Badge>
            <NativeTabs.Trigger.Label>Dynamic</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.BottomAccessory>
            <MiniPlayer isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
          </NativeTabs.BottomAccessory>
        </NativeTabs>
      </ActiveTabsContext.Provider>
    </ThemeProvider>
  );
}
