import MIcons from '@expo/vector-icons/MaterialIcons';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Color, VectorIcon } from 'expo-router';
import { enableZoomTransition } from 'expo-router/internal/utils';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { MiniPlayer } from '../components/mini-player';
import { ActiveTabsContext } from '../utils/active-tabs-context';

// if (process.env.EXPO_OS !== 'web') {
//   Appearance.setColorScheme('unspecified');
// }

enableZoomTransition();

export default function Layout() {
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ActiveTabsContext.Provider value={{ activeTabs, setActiveTabs }}>
        <NativeTabs
          tintColor={Color.ios.label}
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
          // hidden
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
          <NativeTabs.Trigger
            name="index"
            // disableAutomaticContentInsets
            contentStyle={
              {
                // experimental_backgroundImage: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
              }
            }>
            <NativeTabs.Trigger.Label
            // selectedStyle={{ color: '#0f0' }}
            >
              Create
            </NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              // selectedColor="deepNavy"
              sf={{ default: 'ellipsis.message', selected: 'ellipsis.message.fill' }}
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
                default: 'puzzlepiece.extension',
                selected: 'lock.open.applewatch',
              }}
              drawable="ic_lock_open"
            />

            <NativeTabs.Trigger.Label>Plugins</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="dynamic">
            <NativeTabs.Trigger.Icon sf="cloud" drawable="ic_menu" />
            <NativeTabs.Trigger.Label>Cloud</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="explore" role="search">
            {/* <NativeTabs.Trigger.Badge>2</NativeTabs.Trigger.Badge> */}

            <NativeTabs.Trigger.Icon
              // src={require('../../../assets/expo.png')}
              src={{ uri: 'expo' }}
              // sf="expo"
              drawable="ic_search"
            />
            <NativeTabs.Trigger.Label>Deploy</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>

          <NativeTabs.BottomAccessory>
            <MiniPlayer isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
          </NativeTabs.BottomAccessory>
        </NativeTabs>
      </ActiveTabsContext.Provider>
    </ThemeProvider>
  );
}
