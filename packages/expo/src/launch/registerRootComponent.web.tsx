import * as React from 'react';
import { AppRegistry } from 'react-native';

import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  const App = withExpoRoot(component);
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  AppRegistry.registerComponent('main', () => <App exp={{}} />);
  AppRegistry.runApplication('main', { rootTag: document.getElementById('main') });
}
