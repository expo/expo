import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useLinking } from '@react-navigation/native';

export default function useWebLinking(containerRef) {
  if (Platform.OS === 'web') {
    const { getInitialState } = useLinking(containerRef, {
      prefixes: [],
      config: {
        HomeStack: {
          path: 'home-stack',
          screens: {
            Home: 'home',
          },
        },
        LinksStack: {
          path: 'links-stack',
          screens: {
            Links: 'links',
          },
        },
        SettingsStack: {
          path: 'settings-stack',
          screens: {
            Settings: 'settings',
          },
        },
      },
    });

    return useMemo(getInitialState, [getInitialState]);
  }
}
