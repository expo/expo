import * as React from 'react';
import { AppRegistry } from 'react-native';
import wrapWithExpoRoot, { InitialProps } from './wrapWithExpoRoot';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentClass<P>
): void {
  // @ts-ignore: TypeScript says ComponentClass<P> does not satisfy ComponentClass<any>
  AppRegistry.registerComponent('main', () => wrapWithExpoRoot(component));
}
