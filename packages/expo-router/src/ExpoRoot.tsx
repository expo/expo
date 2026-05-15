'use client';

import { type PropsWithChildren, Fragment, type ComponentType, useMemo } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { INTERNAL_SLOT_NAME, NOT_FOUND_ROUTE_NAME, SITEMAP_ROUTE_NAME } from './constants';
import { useDomComponentNavigation } from './domComponents/useDomComponentNavigation';
import { NavigationContainer as UpstreamNavigationContainer } from './fork/NavigationContainer';
import type { ExpoLinkingOptions } from './getLinkingConfig';
import { store, useStore } from './global-state/router-store';
import type { ServerContextType } from './global-state/serverLocationContext';
import { ServerContext } from './global-state/serverLocationContext';
import { StoreContext } from './global-state/storeContext';
import { shouldAppendNotFound, shouldAppendSitemap } from './global-state/utils';
import { LinkPreviewContextProvider } from './link/preview/LinkPreviewContext';
import { handleNavigationOnReady } from './navigationEvents/navigation';
import { Screen } from './primitives';
import type { LinkingOptions, NavigationAction } from './react-navigation/native';
import { StackRouter, useNavigationBuilder } from './react-navigation/native';
import { initScreensFeatureFlags } from './screensFeatureFlags';
import type { RequireContext } from './types';
import { parseUrlUsingCustomBase } from './utils/url';
import { Sitemap } from './views/Sitemap';
import * as SplashScreen from './views/Splash';
import { Unmatched } from './views/Unmatched';

export type ExpoRootProps = {
  context: RequireContext;
  location?: URL | string;
  wrapper?: ComponentType<PropsWithChildren>;
  linking?: Partial<ExpoLinkingOptions>;
};

export type NativeIntent = {
  redirectSystemPath?: (event: {
    path: string | null;
    initial: boolean;
  }) => Promise<string | null | undefined> | string | null | undefined;
};

const isTestEnv = process.env.NODE_ENV === 'test';

const INITIAL_METRICS =
  Platform.OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }
    : undefined;

const documentTitle = {
  enabled: false,
};

/**
 * @hidden
 */
export function ExpoRoot({ wrapper: ParentWrapper = Fragment, ...props }: ExpoRootProps) {
  initScreensFeatureFlags();
  /*
   * Due to static rendering we need to wrap these top level views in second wrapper
   * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
   * is a HTML document, we need to ensure its inside the <body>
   */
  const wrapper = useMemo(
    () =>
      ({ children }: PropsWithChildren) => {
        return (
          <ParentWrapper>
            <LinkPreviewContextProvider>
              <SafeAreaProvider
                // SSR support
                initialMetrics={INITIAL_METRICS}>
                {children}
              </SafeAreaProvider>
            </LinkPreviewContextProvider>
          </ParentWrapper>
        );
      },
    [ParentWrapper]
  );

  return <ContextNavigator {...props} wrapper={wrapper} />;
}

const initialUrl =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;

// TODO(@ubax): Refactor onReady logic and use listeners pattern
function onNavigationReady() {
  handleNavigationOnReady();
  store.onReady();
}

function ContextNavigator({
  context,
  location: initialLocation = initialUrl,
  wrapper: WrapperComponent = Fragment,
  linking = {},
}: ExpoRootProps) {
  // location and linking.getInitialURL are both used to initialize the router state
  //  - location is used on web and during static rendering
  //  - linking.getInitialURL is used on native
  const serverContext = useMemo(() => {
    let contextType: ServerContextType = {};

    const url =
      typeof initialLocation === 'string'
        ? parseUrlUsingCustomBase(initialLocation)
        : initialLocation;

    if (url && url instanceof URL) {
      contextType = {
        location: {
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
        },
      };
    }

    return contextType;
  }, []);

  /*
   * The serverUrl is an initial URL used in server rendering environments.
   * e.g Static renders, units tests, etc
   */
  const serverUrl = serverContext.location
    ? `${serverContext.location.pathname}${serverContext.location.search}${serverContext.location.hash ?? ''}`
    : undefined;

  const store = useStore(context, linking, serverUrl);

  useDomComponentNavigation();

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

  return (
    <StoreContext.Provider value={store}>
      <UpstreamNavigationContainer
        ref={store.navigationRef}
        initialState={store.state}
        linking={store.linking as LinkingOptions<any>}
        onUnhandledAction={onUnhandledAction}
        onStateChange={store.onStateChange}
        documentTitle={documentTitle}
        onReady={onNavigationReady}>
        <ServerContext.Provider value={serverContext}>
          <WrapperComponent>
            <Content />
          </WrapperComponent>
        </ServerContext.Provider>
      </UpstreamNavigationContainer>
    </StoreContext.Provider>
  );
}

function Content() {
  const children = [<Screen name={INTERNAL_SLOT_NAME} component={store.rootComponent} />];
  if (shouldAppendNotFound()) {
    children.push(<Screen name={NOT_FOUND_ROUTE_NAME} component={Unmatched} />);
  }
  if (shouldAppendSitemap()) {
    children.push(<Screen name={SITEMAP_ROUTE_NAME} component={Sitemap} />);
  }
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
    children,
    id: INTERNAL_SLOT_NAME,
  });

  return (
    <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
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
