import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { MiniPlayer } from '../components/mini-player';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('unspecified');
}

export default function Layout() {
  const [isPlaying, setIsPlaying] = useState(false);
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Index label</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="applewatch.side.right" md="watch" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="nested">
          <NativeTabs.Trigger.Icon
            sf={{
              default: 'lock.applewatch',
              selected: 'lock.open.applewatch',
            }}
            drawable="ic_lock_open"
          />
          <NativeTabs.Trigger.Label hidden={Platform.OS !== 'web'} />
          <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge>
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
    </ThemeProvider>
  );
}
