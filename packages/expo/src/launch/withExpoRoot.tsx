import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';

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
    if (__DEV__) {
      return (
        <RootErrorBoundary>
          <AppRootComponent {...combinedProps} />
        </RootErrorBoundary>
      );
    } else {
      return <AppRootComponent {...combinedProps} />;
    }
  };
}
