import * as SplashModule from 'expo-splash-screen';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import { Platform } from 'react-native';

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
  SplashModule.hideAsync();
  globalStack.length = 0;
};

let _preventAutoHideAsyncInvoked = false;

SplashScreen.preventAutoHideAsync = () => {
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
