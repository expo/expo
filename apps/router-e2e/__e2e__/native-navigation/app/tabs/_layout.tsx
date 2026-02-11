import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { MiniPlayer } from '../../components/mini-player';

if (process.env.EXPO_OS !== 'web') {
  Appearance.setColorScheme('unspecified');
}

export default function Layout() {
  const [isPlaying, setIsPlaying] = useState(false);
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        screenListeners={({ route }) => ({
          tabPress: () => {
            console.log(`Tab Pressed: ${route.name}`);
          },
        })}>
        <NativeTabs.Trigger
          name="index"
          contentStyle={{
            experimental_backgroundImage: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
          }}>
          <NativeTabs.Trigger.Label>Index tab</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="applewatch.side.right" md="watch" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="faces"
          listeners={{
            focus: () => {
              console.log('Faces tab focused');
            },
          }}>
          <NativeTabs.Trigger.Icon
            sf={{
              default: 'lock.applewatch',
              selected: 'lock.open.applewatch',
            }}
            drawable="ic_lock_open"
          />
          <NativeTabs.Trigger.Label hidden />
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
