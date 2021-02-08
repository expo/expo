import 'expo/build/Expo.fx';
import { activateKeepAwake } from 'expo-keep-awake';
import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';

import withExpoRoot from './withExpoRoot';
import { InitialProps } from './withExpoRoot.types';

if (__DEV__) {
  // TODO: Make this not a side-effect
  activateKeepAwake();
}

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentType<P>
): void {
  AppRegistry.registerComponent('main', () => withExpoRoot(component));
  if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication('main', { rootTag });
  }
}
