import * as SplashModule from 'expo-splash-screen';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import { Platform } from 'react-native';

import { useDeprecated } from '../useDeprecated';

const globalStack: string[] = [];

/**
 * A stack based component for keeping the splash screen visible.
 * Useful for stacked requests that need to be completed before the app is ready.
 * After all instances have been unmounted, the splash screen will be hidden.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [isLoading, setIsLoading] = React.useState(true);
 *
 *   if (isLoading) {
 *     return <SplashScreen />
 *   }
 *
 *   return <Text>Ready!</Text>
 * }
 * ```
 */
export function SplashScreen() {
  useGlobalSplash();
  useDeprecated(
    'The <SplashScreen /> component is deprecated. Use `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync` from `expo-router` instead.'
  );
  return null;
}

function useGlobalSplash() {
  const stack = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Create a stack entry on component mount
    stack.current = SplashScreen._pushEntry();
    return () => {
      if (stack.current) {
        // Update on component unmount
        SplashScreen._popEntry(stack.current);
      }
    };
  }, []);
}

SplashScreen.hideAsync = () => {
  forceHideAsync();
  globalStack.length = 0;
};

let _userControlledAutoHideEnabled = false;
let _preventAutoHideAsyncInvoked = false;

// Expo Router uses this internal method to ensure that we can detect if the user
// has explicitly opted into preventing the splash screen from hiding. This means
// they will also explicitly hide it. If they don't, we will hide it for them after
// the navigation render completes.
export const _internal_preventAutoHideAsync = () => {
  // Memoize, this should only be called once.
  if (_preventAutoHideAsyncInvoked) {
    return;
  }
  _preventAutoHideAsyncInvoked = true;
  // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
  if (Platform.OS !== 'web' && ErrorUtils?.getGlobalHandler) {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      SplashScreen.hideAsync();
      originalHandler(error, isFatal);
    });
  }
  SplashModule.preventAutoHideAsync();
};

export const _internal_maybeHideAsync = () => {
  // If the user has explicitly opted into preventing the splash screen from hiding,
  // we should not hide it for them. This is often used for animated splash screens.
  if (_userControlledAutoHideEnabled) {
    return;
  }
  SplashScreen.hideAsync();
};

async function forceHideAsync() {
  return SplashModule.hideAsync().catch((error: any) => {
    // Hide this very unfortunate error.
    if (
      // Only throw the error is something unexpected happened.
      _preventAutoHideAsyncInvoked &&
      error.message.includes('No native splash screen registered for ')
    ) {
      return;
    }
    throw error;
  });
}

SplashScreen.preventAutoHideAsync = () => {
  _userControlledAutoHideEnabled = true;
  _internal_preventAutoHideAsync();
};

SplashScreen._pushEntry = (): any => {
  const entry = nanoid();
  globalStack.push(entry);
  SplashScreen.preventAutoHideAsync();
  return entry;
};

SplashScreen._popEntry = (entry: string) => {
  const index = globalStack.indexOf(entry);
  if (index !== -1) {
    globalStack.splice(index, 1);
  }
  if (globalStack.length === 0) {
    SplashScreen.hideAsync();
  }
};

// TODO: Add some detection for if the splash screen is visible
