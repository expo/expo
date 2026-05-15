import '../Expo.fx';

import type { ComponentType } from 'react';

import AppRegistry from './AppRegistry';

declare namespace globalThis {
  const __EXPO_ROUTER_HYDRATE__: unknown;
}

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

/**
 * Sets the initial React component to render in the app's root view on the web.
 *
 * This is the web fork of `registerRootComponent`. It uses a local AppRegistry
 * backed by `react-dom/client` instead of depending on `react-native-web`.
 */
export default function registerRootComponent<P extends InitialProps>(
  component: ComponentType<P>
): void {
  let qualifiedComponent = component;

  if (process.env.NODE_ENV !== 'production') {
    const { withDevTools } = require('./withDevTools') as typeof import('./withDevTools');
    qualifiedComponent = withDevTools(component);
  }

  AppRegistry.registerComponent('main', () => qualifiedComponent);

  // Skip querying the DOM if we're in a Node.js environment.
  if (typeof window !== 'undefined') {
    const rootTag = document.getElementById('root');
    if (process.env.NODE_ENV !== 'production') {
      if (!rootTag) {
        throw new Error('Required HTML element with id "root" was not found in the document HTML.');
      }
    }

    AppRegistry.runApplication('main', {
      rootTag,
      hydrate: globalThis.__EXPO_ROUTER_HYDRATE__,
    });
  }
}
