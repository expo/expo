import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import React, { FunctionComponent, ReactNode, Fragment } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UpstreamNavigationContainer from './fork/NavigationContainer';
import { useInitializeExpoRouter } from './global-state/router-store';
import { RequireContext } from './types';
import { SplashScreen } from './views/Splash';

export type ExpoRootProps = {
  context: RequireContext;
  location?: URL;
  wrapper?: FunctionComponent<{ children: ReactNode }>;
};

function getGestureHandlerRootView() {
  try {
    const { GestureHandlerRootView } =
      require('react-native-gesture-handler') as typeof import('react-native-gesture-handler');

    if (!GestureHandlerRootView) {
      return React.Fragment;
    }

    // eslint-disable-next-line no-inner-declarations
    function GestureHandler(props: any) {
      return <GestureHandlerRootView style={styles.gesture} {...props} />;
    }
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error
      GestureHandler.displayName = 'GestureHandlerRootView';
    }
    return GestureHandler;
  } catch {
    return React.Fragment;
  }
}

const GestureHandlerRootView = getGestureHandlerRootView();

const isSSR = Platform.OS === 'web' && typeof window === 'undefined';
const isTestEnv = process.env.NODE_ENV === 'test';

const INITIAL_METRICS =
  isSSR || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }
    : undefined;

const hasViewControllerBasedStatusBarAppearance =
  Platform.OS === 'ios' &&
  !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;

export function ExpoRoot({ wrapper: ParentWrapper = Fragment, ...props }: ExpoRootProps) {
  /*
   * Due to static rendering we need to wrap these top level views in second wrapper
   * View's like <GestureHandlerRootView /> generate a <div> so if the parent wrapper
   * is a HTML document, we need to ensure its inside the <body>
   */
  const wrapper = ({ children }) => {
    return (
      <ParentWrapper>
        <GestureHandlerRootView>
          <SafeAreaProvider
            // SSR support
            initialMetrics={INITIAL_METRICS}>
            {children}
            {/* Users can override this by adding another StatusBar element anywhere higher in the component tree. */}
            {!hasViewControllerBasedStatusBarAppearance && <StatusBar style="auto" />}
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ParentWrapper>
    );
  };

  return <ContextNavigator {...props} wrapper={wrapper} />;
}

const initialUrl =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;

function ContextNavigator({
  context,
  location: initialLocation = initialUrl,
  wrapper: WrapperComponent = Fragment,
}: ExpoRootProps) {
  const store = useInitializeExpoRouter(context, initialLocation);

  if (store.shouldShowTutorial()) {
    SplashScreen.hideAsync();
    if (process.env.NODE_ENV === 'development') {
      const Tutorial = require('./onboard/Tutorial').Tutorial;
      return (
        <WrapperComponent>
          <Tutorial />
        </WrapperComponent>
      );
    } else {
      // Ensure tutorial styles are stripped in production.
      return null;
    }
  }

  const Component = store.rootComponent;

  return (
    <UpstreamNavigationContainer
      ref={store.navigationRef}
      initialState={store.initialState}
      linking={store.linking}
      documentTitle={{
        enabled: false,
      }}>
      <WrapperComponent>
        <Component />
      </WrapperComponent>
    </UpstreamNavigationContainer>
  );
}

const styles = StyleSheet.create({
  gesture: { flex: 1 },
});
