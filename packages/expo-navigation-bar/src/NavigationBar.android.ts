import { type EventSubscription } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import { processColor } from 'react-native';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

import ExpoNavigationBar from './ExpoNavigationBar';
import type {
  NavigationBarBehavior,
  NavigationBarButtonStyle,
  NavigationBarPosition,
  NavigationBarStyle,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

// This line only imports the type information for TypeScript type checking.  It
// doesn't import the actual module in the compiled JavaScript code.  The actual
// module is imported conditionally with require() below, in order to avoid
// importing the module if edge-to-edge is not enabled (which could throw if
// it's not linked).
let SystemBars: typeof import('react-native-edge-to-edge').SystemBars | null = null;

if (isEdgeToEdge()) {
  SystemBars = require('react-native-edge-to-edge').SystemBars;
}

export function addVisibilityListener(
  listener: (event: NavigationBarVisibilityEvent) => void
): EventSubscription {
  return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}

export async function setBackgroundColorAsync(color: string): Promise<void> {
  if (SystemBars != null) {
    console.warn('`setBackgroundColorAsync` is not supported with edge-to-edge enabled.');
    return;
  }

  const colorNumber = processColor(color);
  await ExpoNavigationBar.setBackgroundColorAsync(colorNumber);
}

export async function getBackgroundColorAsync(): Promise<string> {
  if (SystemBars != null) {
    console.warn('`getBackgroundColorAsync` is not supported with edge-to-edge enabled.');
    return `#00000000`;
  }

  return await ExpoNavigationBar.getBackgroundColorAsync();
}

export async function setBorderColorAsync(color: string): Promise<void> {
  if (SystemBars != null) {
    console.warn('`setBorderColorAsync` is not supported with edge-to-edge enabled.');
    return;
  }

  const colorNumber = processColor(color);
  await ExpoNavigationBar.setBorderColorAsync(colorNumber);
}

export async function getBorderColorAsync(): Promise<string> {
  if (SystemBars != null) {
    console.warn('`getBorderColorAsync` is not supported with edge-to-edge enabled.');
    return `#00000000`;
  }

  return await ExpoNavigationBar.getBorderColorAsync();
}

export async function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  if (SystemBars != null) {
    SystemBars.setHidden({ navigationBar: visibility === 'hidden' });
    return;
  }

  await ExpoNavigationBar.setVisibilityAsync(visibility);
}

export async function getVisibilityAsync(): Promise<NavigationBarVisibility> {
  return ExpoNavigationBar.getVisibilityAsync();
}

export async function setButtonStyleAsync(style: NavigationBarButtonStyle): Promise<void> {
  if (SystemBars != null) {
    SystemBars.setStyle({ navigationBar: style });
    return;
  }

  await ExpoNavigationBar.setButtonStyleAsync(style);
}

export async function getButtonStyleAsync(): Promise<NavigationBarButtonStyle> {
  if (SystemBars != null) {
    console.warn('`getButtonStyleAsync` is not supported with edge-to-edge enabled.');
    return 'light';
  }

  return await ExpoNavigationBar.getButtonStyleAsync();
}

export async function setPositionAsync(position: NavigationBarPosition): Promise<void> {
  if (SystemBars != null) {
    console.warn('`setPositionAsync` is not supported with edge-to-edge enabled.');
    return;
  }

  await ExpoNavigationBar.setPositionAsync(position);
}

export async function unstable_getPositionAsync(): Promise<NavigationBarPosition> {
  if (SystemBars != null) {
    console.warn('`unstable_getPositionAsync` is not supported with edge-to-edge enabled.');
    return 'relative';
  }

  return await ExpoNavigationBar.unstable_getPositionAsync();
}

export async function setBehaviorAsync(behavior: NavigationBarBehavior): Promise<void> {
  if (SystemBars != null) {
    console.warn('`setBehaviorAsync` is not supported with edge-to-edge enabled.');
    return;
  }

  await ExpoNavigationBar.setBehaviorAsync(behavior);
}

export async function getBehaviorAsync(): Promise<NavigationBarBehavior> {
  if (SystemBars != null) {
    console.warn('`getBehaviorAsync` is not supported with edge-to-edge enabled.');
    return 'inset-touch';
  }

  return await ExpoNavigationBar.getBehaviorAsync();
}

export function setStyle(style: NavigationBarStyle) {
  if (SystemBars != null) {
    SystemBars.setStyle({ navigationBar: style });
    return;
  }

  throw new Error(
    '`setStyle` is only supported on Android when edge-to-edge is enabled. Enable edge-to-edge or use the `setButtonStyle` function instead.'
  );
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
