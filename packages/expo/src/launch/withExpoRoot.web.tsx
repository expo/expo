import * as React from 'react';
import * as ErrorRecovery from 'expo-error-recovery';

import RootErrorBoundary from './RootErrorBoundary';
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

      if (__DEV__) {
        return (
          <RootErrorBoundary>
            <AppRootComponent {...props} />
          </RootErrorBoundary>
        );
      } else {
        return <AppRootComponent {...props} />;
      }
    }
  };
}
