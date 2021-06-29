import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';

import { InitialProps } from './withExpoRoot.types';

// This method can be optionally imported because __DEV__ never changes during runtime.
// Using __DEV__ like this enables tree shaking to remove the hook in production.
let activateDevKeepAwake: (tag?: string) => void;

if (__DEV__) {
  try {
    // Optionally import expo-keep-awake
    const { activateKeepAwake } = require('expo-keep-awake');
    activateDevKeepAwake = activateKeepAwake;
  } catch {}
}

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function ExpoRoot(props: P) {
    // Using `useKeepAwake` throws an exception when the app is closed on Android.
    // On app close, the `currentActivity` is null and deactivating will always throw.
    React.useEffect(() => activateDevKeepAwake(), []);

    const combinedProps = {
      ...props,
      exp: { ...props.exp, errorRecovery: ErrorRecovery.recoveredProps },
    };

    return <AppRootComponent {...combinedProps} />;
  };
}
