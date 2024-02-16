import '../Expo.fx';

import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';

type InitialProps = {
  exp?: {
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
  let qualifiedComponent = component;

  if (process.env.NODE_ENV !== 'production') {
    const { withDevTools } = require('./withDevTools') as typeof import('./withDevTools');
    qualifiedComponent = withDevTools(component);
  }

  AppRegistry.registerComponent('main', () => qualifiedComponent);
  if (Platform.OS === 'web') {
    // Use two if statements for better dead code elimination.
    if (
      // Skip querying the DOM if we're in a Node.js environment.
      typeof document !== 'undefined'
    ) {
      const rootTag = document.getElementById('root');
      if (process.env.NODE_ENV !== 'production') {
        if (!rootTag) {
          throw new Error(
            'Required HTML element with id "root" was not found in the document HTML.'
          );
        }
      }
      AppRegistry.runApplication('main', {
        rootTag,
        hydrate: process.env.EXPO_PUBLIC_USE_STATIC === '1',
      });
    }
  }
}
