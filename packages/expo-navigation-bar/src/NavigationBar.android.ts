import { type EventSubscription } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import ExpoNavigationBar from './ExpoNavigationBar';
import type {
  NavigationBarStyle,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

function isLightColorScheme() {
  const colorScheme = Appearance?.getColorScheme() ?? 'light';
  return colorScheme === 'light';
}

function navigationBarStyleToButtonStyle(navigationBarStyle: NavigationBarStyle): 'light' | 'dark' {
  switch (navigationBarStyle) {
    case 'auto':
      return isLightColorScheme() ? 'dark' : 'light';
    case 'light':
      return 'dark';
    case 'dark':
      return 'light';
    case 'inverted':
      return isLightColorScheme() ? 'light' : 'dark';
  }
}

export function addVisibilityListener(
  listener: (event: NavigationBarVisibilityEvent) => void
): EventSubscription {
  return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}

export async function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  await ExpoNavigationBar.setVisibilityAsync(visibility);
}

export async function getVisibilityAsync(): Promise<NavigationBarVisibility> {
  return ExpoNavigationBar.getVisibilityAsync();
}

export function setStyle(style: NavigationBarStyle) {
  ExpoNavigationBar.setButtonStyleAsync(navigationBarStyleToButtonStyle(style));
}

export function useVisibility(): NavigationBarVisibility | null {
  const [visibility, setVisible] = useState<NavigationBarVisibility | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVisibilityAsync().then((visibility) => {
      if (isMounted) {
        setVisible(visibility);
      }
    });

    const listener = addVisibilityListener(({ visibility }) => {
      if (isMounted) {
        setVisible(visibility);
      }
    });

    return () => {
      listener.remove();
      isMounted = false;
    };
  }, []);

  return visibility;
}
