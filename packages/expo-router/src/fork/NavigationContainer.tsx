import React from 'react';
import { I18nManager } from 'react-native';

import type { RouteNode } from '../Route';
import { RouterConfigContext } from '../global-state/routerConfigContext';
import { BaseNavigationContainer } from '../react-navigation/core/BaseNavigationContainer';
import type {
  LinkingOptions,
  LocaleDirection,
  NavigationContainerProps,
  NavigationState,
  NavigationContainerRef,
  ParamListBase,
} from '../react-navigation/native';
import {
  DefaultTheme,
  LinkingContext,
  LocaleDirContext,
  ThemeProvider,
} from '../react-navigation/native';
import { getPathFromState } from './getPathFromState';
import { getStateFromPath } from './getStateFromPath';
import { useBackButton } from './useBackButton';
import { useLinking } from './useLinking';
import { validatePathConfig } from './validatePathConfig';

declare global {
  // eslint-disable-next-line no-var
  var REACT_NAVIGATION_DEVTOOLS: WeakMap<
    NavigationContainerRef<any>,
    { readonly linking: LinkingOptions<any> }
  >;
}

globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();

type Props<ParamList extends object> = Omit<NavigationContainerProps, 'initialState'> & {
  direction?: LocaleDirection;
  linking?: LinkingOptions<ParamList>;
  fallback?: React.ReactNode;
};

/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.direction Text direction of the components. Defaults to `'ltr'`.
 * @param props.theme Theme object for the UI elements.
 * @param props.linking Options for deep linking.
 * @param props.fallback Fallback component to render until we have finished getting initial state. Defaults to `null`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner({
  direction = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr',
  theme = DefaultTheme,
  linking,
  fallback = null,
  ref,
  ...rest
}: Props<ParamListBase> & {
  ref?: React.Ref<NavigationContainerRef<ParamListBase> | null>;
}) {
  const routerConfig = React.use(RouterConfigContext);

  if (linking?.config) {
    validatePathConfig(linking.config);
  }

  const refContainer = React.useRef<NavigationContainerRef<ParamListBase> | null>(null);

  useBackButton(refContainer);

  const { getInitialState } = useLinking(refContainer, {
    prefixes: [],
    ...linking,
  });

  const linkingContext = React.useMemo(() => ({ options: linking }), [linking]);
  // Kept outside the Suspense boundary so a retry after loading reads the same promise.
  const [initialState] = React.useState(getInitialState);

  return (
    <React.Suspense fallback={<ThemeProvider value={theme}>{fallback}</ThemeProvider>}>
      <LocaleDirContext.Provider value={direction}>
        <LinkingContext.Provider value={linkingContext}>
          <InitialStateNavigationContainer
            {...rest}
            initialState={initialState}
            linking={linking}
            theme={theme}
            routeNode={routerConfig?.routeNode ?? undefined}
            containerRef={refContainer}
            ref={ref}
          />
        </LinkingContext.Provider>
      </LocaleDirContext.Provider>
    </React.Suspense>
  );
}

function InitialStateNavigationContainer({
  initialState: initialStateOrPromise,
  linking,
  routeNode,
  containerRef,
  ref,
  ...rest
}: Omit<NavigationContainerProps, 'initialState'> & {
  initialState: NavigationState | undefined | PromiseLike<NavigationState | undefined>;
  linking: LinkingOptions<ParamListBase> | undefined;
  routeNode: RouteNode | undefined;
  containerRef: React.RefObject<NavigationContainerRef<ParamListBase> | null>;
  ref?: React.Ref<NavigationContainerRef<ParamListBase> | null>;
}) {
  const initialState = isThenable(initialStateOrPromise)
    ? React.use(initialStateOrPromise)
    : initialStateOrPromise;
  // Set here, not in the parent, so the ref is set once the container mounts after waiting.
  React.useImperativeHandle(ref, () => containerRef.current!);
  // Add additional linking related info to the ref
  // This will be used by the devtools
  React.useEffect(() => {
    if (containerRef.current) {
      REACT_NAVIGATION_DEVTOOLS.set(containerRef.current, {
        get linking() {
          return {
            ...linking,
            prefixes: linking?.prefixes ?? [],
            getStateFromPath: linking?.getStateFromPath ?? getStateFromPath,
            getPathFromState: linking?.getPathFromState ?? getPathFromState,
          };
        },
      });
    }
  });
  if (initialState === undefined) {
    throw new Error(
      'Linking did not produce an initial navigation state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }

  return (
    <BaseNavigationContainer
      {...rest}
      initialState={initialState}
      UNSTABLE_routeNode={routeNode}
      ref={containerRef}
    />
  );
}

function isThenable<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

// The implementation uses the base param list, while callers retain their concrete route types.
export const NavigationContainer = NavigationContainerInner as <
  RootParamList extends object = ReactNavigation.RootParamList,
>(
  props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  }
) => React.ReactElement;
