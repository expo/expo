import * as React from 'react';
import { AppRegistry } from 'react-native';

import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  const App = withExpoRoot(component);
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  const RootComponent = (...props) => <App exp={{}} {...props} />;
  AppRegistry.registerComponent('main', () => RootComponent);
  const rootTag = document.getElementById('root') || document.getElementById('main');
  AppRegistry.runApplication('main', { rootTag });
}
