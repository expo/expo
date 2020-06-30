import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import { Platform } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Notifications from '../Notifications/Notifications';
import RootErrorBoundary from './RootErrorBoundary';
import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function ExpoRoot(props: P) {
    const didInitialize = React.useRef(false);
    if (!didInitialize.current) {
      const { exp } = props;
      if (exp.notification) {
        Notifications._setInitialNotification(exp.notification);
      }

      didInitialize.current = true;
    }

    const combinedProps = {
      ...props,
      exp: { ...props.exp, errorRecovery: ErrorRecovery.recoveredProps },
    };

    // NOTE(brentvatne): reasons why we use these providers below. we should aim
    // to remove them.
    // 1) AppearanceProvider: useColorScheme does not work correctly on iOS without it
    // 2) SafeAreaProvider: initial layout measurements can be incorrect on Android
    // 3) we include them on all platforms for consistency - also see withExpoRoot.web.tsx
    const AppWithProviders = (
      <AppearanceProvider>
        <SafeAreaProvider>
          <AppRootComponent {...combinedProps} />
        </SafeAreaProvider>
      </AppearanceProvider>
    );

    if (__DEV__ && Platform.OS === 'android') {
      return <RootErrorBoundary>{AppWithProviders}</RootErrorBoundary>;
    } else {
      return AppWithProviders;
    }
  };
}
