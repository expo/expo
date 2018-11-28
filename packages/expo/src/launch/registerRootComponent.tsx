import * as React from 'react';
import { AppRegistry } from 'react-native';
import withExpoRoot, { InitialProps } from './withExpoRoot';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  AppRegistry.registerComponent('main', () => withExpoRoot(component));
}
