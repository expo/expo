import * as ErrorRecovery from 'expo-error-recovery';
import * as React from 'react';

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

      return <AppRootComponent {...props} />;
    }
  };
}
