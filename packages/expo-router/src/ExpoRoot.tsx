import { useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getRouteInfoFromState } from './LocationProvider';
import UpstreamNavigationContainer from './fork/NavigationContainer';
import getPathFromState, { getPathDataFromState } from './fork/getPathFromState';
import { ResultState } from './fork/getStateFromPath';
import { getLinkingConfig } from './getLinkingConfig';
import { getRoutes } from './getRoutes';
import {
  ExpoRouterContextType,
  ExpoRouterContext,
  RootStateContext,
  RootStateContextType,
  OnboardingExpoRouterContextType,
} from './hooks';
import { RequireContext } from './types';
import { getQualifiedRouteComponent } from './useScreens';
import { SplashScreen } from './views/Splash';

function getGestureHandlerRootView() {
  try {
    const { GestureHandlerRootView } =
      require('react-native-gesture-handler') as typeof import('react-native-gesture-handler');

    return function GestureHandler(props: any) {
      return <GestureHandlerRootView style={{ flex: 1 }} {...props} />;
    };
  } catch {
    return React.Fragment;
  }
}

const GestureHandlerRootView = getGestureHandlerRootView();

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export type ExpoRootProps = {
  context: RequireContext;
  location?: URL;
};

export function ExpoRoot({ context, location }: ExpoRootProps) {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider
        // SSR support
        initialMetrics={INITIAL_METRICS}>
        <ContextNavigator context={context} location={location} />
        {/* Users can override this by adding another StatusBar element anywhere higher in the component tree. */}
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const initialUrl =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;

function ContextNavigator({ context, location: initialLocation = initialUrl }: ExpoRootProps) {
  const navigationRef = useNavigationContainerRef();
  const [shouldShowSplash, setShowSplash] = React.useState(Platform.OS !== 'web');

  const expoContext = React.useMemo<ExpoRouterContextType | OnboardingExpoRouterContextType>(() => {
    const routeNode = getRoutes(context);
    const linking = getLinkingConfig(routeNode!);
    let initialState: ResultState | undefined;

    if (initialLocation) {
      initialState = linking.getStateFromPath?.(
        initialLocation.pathname + initialLocation.search,
        linking.config
      );
    }

    function getRouteInfo(state: ResultState) {
      return getRouteInfoFromState(
        (state: Parameters<typeof getPathFromState>[0], asPath: boolean) => {
          return getPathDataFromState(state, {
            screens: [],
            ...linking.config,
            preserveDynamicRoutes: asPath,
            preserveGroups: asPath,
          });
        },
        state
      );
    }

    // This looks redundant but it makes TypeScript correctly infer the union return type.
    return {
      routeNode,
      linking,
      navigationRef,
      initialState,
      getRouteInfo,
    };
  }, [context, navigationRef, initialLocation]);

  const { routeNode, initialState, linking, getRouteInfo } = expoContext;

  const [rootState, setRootState] = React.useState<RootStateContextType>(() => {
    if (initialState) {
      return {
        state: initialState,
        routeInfo: getRouteInfo(initialState),
      };
    } else {
      return {
        routeInfo: {
          unstable_globalHref: '',
          pathname: '',
          params: {},
          segments: [],
        },
      };
    }
  });

  React.useEffect(() => {
    const subscription = navigationRef.addListener('state', (data) => {
      const state = data.data.state as ResultState;
      setRootState({
        state,
        routeInfo: getRouteInfo(state),
      });
    });

    return () => subscription?.();
  }, [navigationRef, getRouteInfo]);

  if (!routeNode) {
    if (process.env.NODE_ENV === 'development') {
      const Tutorial = require('./onboard/Tutorial').Tutorial;
      SplashScreen.hideAsync();
      return <Tutorial />;
    } else {
      throw new Error('No routes found');
    }
  }

  const Component = getQualifiedRouteComponent(routeNode);

  return (
    <>
      {shouldShowSplash && <SplashScreen />}
      <ExpoRouterContext.Provider value={expoContext}>
        <UpstreamNavigationContainer
          ref={navigationRef}
          initialState={initialState}
          linking={linking}
          onReady={() => requestAnimationFrame(() => setShowSplash(false))}>
          <RootStateContext.Provider value={rootState}>
            {!shouldShowSplash && <Component />}
          </RootStateContext.Provider>
        </UpstreamNavigationContainer>
      </ExpoRouterContext.Provider>
    </>
  );
}
