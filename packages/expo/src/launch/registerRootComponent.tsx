import 'expo/build/Expo.fx';

import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';

type InitialProps = {
  exp: {
    notification?: any;
    manifestString?: string;
    [key: string]: any;
  };
  shell?: boolean;
  shellManifestUrl?: string;
  [key: string]: any;
};

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentType<P>
): void {
  if (process.env.NODE_ENV === 'production') {
    AppRegistry.registerComponent('main', () => component);
  } else {
    const { withDevTools } = require('./withDevTools') as typeof import('./withDevTools');
    AppRegistry.registerComponent('main', () => withDevTools(component));
  }

  if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication('main', { rootTag });
  }
}
