import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';
import { AppearanceProvider } from 'react-native-appearance';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentClass<P> {
  return class ExpoRootComponent extends React.Component<P> {
    render() {
      const props = {
        ...this.props,
        exp: { ...this.props.exp, errorRecovery: ErrorRecovery.recoveredProps },
      };

      return (
        <AppearanceProvider>
          <SafeAreaProvider>
            <AppRootComponent {...props} />;
          </SafeAreaProvider>
        </AppearanceProvider>
      );
    }
  };
}
