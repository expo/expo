'use client';

import { NavigationAction } from '@react-navigation/native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import React, { type PropsWithChildren, Fragment, type ComponentType } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UpstreamNavigationContainer from './fork/NavigationContainer';
import { useInitializeExpoRouter } from './global-state/router-store';
import { ServerLocationContext } from './global-state/serverLocationContext';
import { RequireContext } from './types';
import { SplashScreen } from './views/Splash';

export type ExpoRootProps = {
  context: RequireContext;
  location?: URL;
  wrapper?: ComponentType<PropsWithChildren>;
};

const isTestEnv = process.env.NODE_ENV === 'test';

const INITIAL_METRICS =
  Platform.OS === 'web' || isTestEnv
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
   * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
   * is a HTML document, we need to ensure its inside the <body>
   */
  const wrapper = ({ children }: PropsWithChildren) => {
    return (
      <ParentWrapper>
        <SafeAreaProvider
          // SSR support
          initialMetrics={INITIAL_METRICS}>
          {children}
          {/* Users can override this by adding another StatusBar element anywhere higher in the component tree. */}
          {!hasViewControllerBasedStatusBarAppearance && <StatusBar style="auto" />}
        </SafeAreaProvider>
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
      onUnhandledAction={onUnhandledAction}
      documentTitle={{
        enabled: false,
      }}>
      <ServerLocationContext.Provider value={initialLocation}>
        <WrapperComponent>
          <Component />
        </WrapperComponent>
      </ServerLocationContext.Provider>
    </UpstreamNavigationContainer>
  );
}

let onUnhandledAction: (action: NavigationAction) => void;

if (process.env.NODE_ENV !== 'production') {
  onUnhandledAction = (action: NavigationAction) => {
    const payload: Record<string, any> | undefined = action.payload;

    let message = `The action '${action.type}'${
      payload ? ` with payload ${JSON.stringify(action.payload)}` : ''
    } was not handled by any navigator.`;

    switch (action.type) {
      case 'NAVIGATE':
      case 'PUSH':
      case 'REPLACE':
      case 'JUMP_TO':
        if (payload?.name) {
          message += `\n\nDo you have a route named '${payload.name}'?`;
        } else {
          message += `\n\nYou need to pass the name of the screen to navigate to. This may be a bug.`;
        }

        break;
      case 'GO_BACK':
      case 'POP':
      case 'POP_TO_TOP':
        message += `\n\nIs there any screen to go back to?`;
        break;
      case 'OPEN_DRAWER':
      case 'CLOSE_DRAWER':
      case 'TOGGLE_DRAWER':
        message += `\n\nIs your screen inside a Drawer navigator?`;
        break;
    }

    message += `\n\nThis is a development-only warning and won't be shown in production.`;

    if (process.env.NODE_ENV === 'test') {
      throw new Error(message);
    }
    console.error(message);
  };
} else {
  onUnhandledAction = function () {};
}
