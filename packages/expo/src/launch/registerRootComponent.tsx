import '../Expo.fx';

import { _flushPending } from 'expo-font';
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

function useFlushPendingFonts() {
  const flushPendingPromise = React.useMemo(() => _flushPending(), []);
  const [isLoaded, setLoaded] = React.useState(flushPendingPromise === true);

  React.useEffect(() => {
    let isMounted = true;
    if (flushPendingPromise !== true) {
      flushPendingPromise.then(() => {
        if (isMounted) setLoaded(true);
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  return isLoaded;
}

function withFontLoading<TComponent extends React.ComponentType<any>>(
  AppRootComponent: TComponent
): React.ComponentType<React.ComponentProps<TComponent>> {
  function WithAsyncAssets(props: React.ComponentProps<TComponent>) {
    const isLoading = useFlushPendingFonts();
    // In production native apps, the fonts are loaded instantly because the assets are offline.
    // In development, we need to wait for the fonts to load over the dev server before rendering the app.
    if (!isLoading) {
      return null;
    }

    return <AppRootComponent {...props} />;
  }

  if (process.env.NODE_ENV !== 'production') {
    const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
    WithAsyncAssets.displayName = `withAssets(${name})`;
  }

  return WithAsyncAssets;
}

export default function registerRootComponent<P extends InitialProps>(
  component: React.ComponentType<P>
): void {
  let qualifiedComponent = withFontLoading(component);

  if (process.env.NODE_ENV !== 'production') {
    const { withDevTools } = require('./withDevTools') as typeof import('./withDevTools');
    qualifiedComponent = withDevTools(qualifiedComponent);
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
