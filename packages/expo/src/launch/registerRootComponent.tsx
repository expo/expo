import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';
import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  AppRegistry.registerComponent('main', () => withExpoRoot(component));
  if (Platform.OS === 'web' && document.getElementById) {
    AppRegistry.runApplication('main', { rootTag: document.getElementById('main') });
  }
}
