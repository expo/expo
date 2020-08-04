import * as React from 'react';
import { AppRegistry } from 'react-native';

import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentType<P>
): void {
  const App = withExpoRoot(component);
  const RootComponent: React.FC<P> = props => <App {...props} />;
  AppRegistry.registerComponent('main', () => RootComponent);
  const rootTag = document.getElementById('root') ?? document.getElementById('main');
  AppRegistry.runApplication('main', { rootTag });
}
