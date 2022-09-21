import * as React from 'react';

import { InitialProps } from './withExpoRoot.types';

export default function withExpoRoot<P extends InitialProps>(
  AppRootComponent: React.ComponentType<P>
): React.ComponentClass<P> {
  return class ExpoRootComponent extends React.Component<P> {
    render() {
      return <AppRootComponent {...this.props} />;
    }
  };
}
