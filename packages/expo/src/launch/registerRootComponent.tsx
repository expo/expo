import '../Expo.fx';

import { type ComponentType } from 'react';
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

// @needsAudit
/**
 * Sets the initial React component to render natively in the app's root React Native view on Android, iOS, tvOS and the web.
 *
 * This method does the following:
 * - Invokes React Native's `AppRegistry.registerComponent`.
 * - Invokes React Native web's `AppRegistry.runApplication` on web to render to the root `index.html` file.
 * - Polyfills the `process.nextTick` function globally.
 *
 * This method also adds the following dev-only features that are removed in production bundles.
 * - Adds the Fast Refresh and bundle splitting indicator to the app.
 * - Asserts if the `expo-updates` package is misconfigured.
 * - Asserts if `react-native` is not aliased to `react-native-web` when running in the browser.
 * @param component The React component class that renders the rest of your app.
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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const rootTag = document.getElementById('root');
    if (process.env.NODE_ENV !== 'production') {
      if (!rootTag) {
        throw new Error('Required HTML element with id "root" was not found in the document HTML.');
      }
    }

    AppRegistry.runApplication('main', {
      rootTag,
      // Injected by SSR HTML tags.
      hydrate: globalThis.__EXPO_ROUTER_HYDRATE__,
    });
  }
}
