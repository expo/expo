import 'expo/build/Expo.fx';
import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';

import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentType<P>
): void {
  AppRegistry.registerComponent('main', () => withExpoRoot(component));
  if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication('main', { rootTag });
  }
}
