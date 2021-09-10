import * as React from 'react';

import { attachRecoveredProps } from './RecoveryProps';
import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentClass<P> {
  return class ExpoRootComponent extends React.Component<P> {
    render() {
      const combinedProps = attachRecoveredProps(this.props);
      return <AppRootComponent {...combinedProps} />;
    }
  };
}
