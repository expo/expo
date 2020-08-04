import 'expo/build/Expo.fx';
import * as React from 'react';
import { AppRegistry } from 'react-native';

export default function registerRootComponent<P>(component: React.ComponentType<P>): void {
  AppRegistry.registerComponent('main', () => component);
}
