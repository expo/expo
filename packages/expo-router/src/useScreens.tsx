'use client';

import React, { use, useEffect } from 'react';

import type { LoadedRoute, RouteNode } from './Route';
import { SuspenseFallbackContext, Route, sortRoutesWithInitial, useRouteNode } from './Route';
import { useExpoRouterStore } from './global-state/storeContext';
import { useColorSchemeChangesIfNeeded } from './global-state/utils';
// Direct import to prevent a require cycle
import { useCurrentRouteInfo } from './hooks/useCurrentRouteInfo';
import EXPO_ROUTER_IMPORT_MODE from './import-mode';
import { useGuardRedirect } from './layouts/GuardContext';
import { Redirect } from './link/Redirect';
import { ZoomTransitionEnabler } from './link/zoom/ZoomTransitionEnabler';
import { ZoomTransitionTargetContextProvider } from './link/zoom/zoom-transition-context-providers';
import { unstable_navigationEvents } from './navigationEvents';
import {
  hasParam,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  removeParams,
} from './navigationParams';
import { Screen } from './primitives';
import type { BottomTabNavigationEventMap } from './react-navigation/bottom-tabs';
import {
  useStateForPath,
  type EventConsumer,
  type EventMapBase,
  type NavigationProp,
  type NavigationState,
  type ParamListBase,
  type RouteProp,
  type RouteSource,
  type ScreenListeners,
} from './react-navigation/native';
import type { NativeStackNavigationEventMap } from './react-navigation/native-stack';
import type { Href, UnknownOutputParams } from './types';
import { EmptyRoute } from './views/EmptyRoute';
import {
  SuspenseFallback as DefaultSuspenseFallback,
  type SuspenseFallbackProps,
} from './views/SuspenseFallback';
import { Try } from './views/Try';

declare module 'react' {
  export function lazy<T extends React.ComponentType<any>>(
    load: () => PromiseLike<{ default: T }> | Promise<{ default: T }>
  ): React.LazyExoticComponent<T>;
}

export type ScreenProps<
  TOptions extends Record<string, any> = Record<string, any>,
  TState extends NavigationState = NavigationState,
  TEventMap extends EventMapBase = EventMapBase,
> = {
  /** Name is required when used inside a Layout component. */
  name?: string;
  /**
   * Redirect to the nearest sibling route.
   * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
   */
  redirect?: boolean;
  initialParams?: Record<string, any>;
  options?:
    | TOptions
    | ((prop: { route: RouteProp<ParamListBase, string>; navigation: any }) => TOptions);

  listeners?:
    | ScreenListeners<TState, TEventMap>
    | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenListeners<TState, TEventMap>);

  getId?: ({ params }: { params?: Record<string, any> }) => string | undefined;

  dangerouslySingular?: SingularOptions;
};

export type SingularOptions =
  | boolean
  | ((name: string, params: UnknownOutputParams) => string | undefined);

function getSortedChildren(
  children: RouteNode[],
  order: ScreenProps[] = [],
  initialRouteName?: string
): { route: RouteNode; props: Partial<ScreenProps>; routeSource: RouteSource }[] {
  if (!order?.length) {
    return children
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((route) => ({ route, props: {}, routeSource: 'filesystem' as const }));
  }
  const entries = [...children];

  const ordered = order
    .map(
      ({
        name,
        redirect,
        initialParams,
        listeners,
        options,
        getId,
        dangerouslySingular: singular,
      }) => {
        if (!entries.length) {
          console.warn(
            `[Layout children]: Too many screens defined. Route "${name}" is extraneous.`
          );
          return null;
        }
        const matchIndex = entries.findIndex(
          (child) => child.route === name || child.route === `${name}/index`
        );
        if (matchIndex === -1) {
          console.warn(
            `[Layout children]: No route named "${name}" exists in nested children:`,
            children.map(({ route }) => route)
          );
          return null;
        } else {
          // Get match and remove from entries
          const match = entries[matchIndex];
          entries.splice(matchIndex, 1);

          // Ensure to return null after removing from entries.
          if (redirect) {
            if (typeof redirect === 'string') {
              throw new Error(`Redirecting to a specific route is not supported yet.`);
            }
            return null;
          }

          if (getId) {
            console.warn(
              `Deprecated: prop 'getId' on screen ${name} is deprecated. Please rename the prop to 'dangerouslySingular'`
            );
            if (singular) {
              console.warn(
                `Screen ${name} cannot use both getId and dangerouslySingular together.`
              );
            }
          } else if (singular) {
            // If singular is set, use it as the getId function.
            if (typeof singular === 'string') {
              getId = () => singular;
            } else if (typeof singular === 'function' && name) {
              getId = (options) => singular(name, options.params || {});
            } else if (singular === true && name) {
              getId = (options) => getSingularId(name, options);
            }
          }

          return {
            route: match,
            props: { initialParams, listeners, options, getId },
            routeSource: 'layout' as const,
          };
        }
      }
    )
    .filter(Boolean) as {
    route: RouteNode;
    props: Partial<ScreenProps>;
    routeSource: RouteSource;
  }[];

  // Add any remaining children
  ordered.push(
    ...entries
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((route) => ({ route, props: {}, routeSource: 'filesystem' as const }))
  );

  return ordered;
}

/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export function useSortedScreens(
  order: ScreenProps[],
  guardedRedirects: Map<string, Href | undefined> = new Map(),
  useOnlyUserDefinedScreens: boolean = false
): React.ReactNode[] {
  const node = useRouteNode();

  const nodeChildren = node?.children ?? [];
  const children = useOnlyUserDefinedScreens
    ? nodeChildren.filter((child) =>
        order.some(
          (userDefinedScreen) =>
            userDefinedScreen.name === child.route ||
            `${userDefinedScreen.name}/index` === child.route
        )
      )
    : nodeChildren;

  const sorted = children.length ? getSortedChildren(children, order, node?.initialRouteName) : [];
  return React.useMemo(() => {
    const screensWithGuarded = sorted.map((value) => {
      const route = value.route.route;
      const isGuarded =
        guardedRedirects.has(route) || guardedRedirects.has(route.replace(/\/index$/, ''));
      return { ...value, isGuarded };
    });
    const allScreensGuarded =
      screensWithGuarded.length > 0 && screensWithGuarded.every((item) => item.isGuarded);

    if (allScreensGuarded) {
      return [];
    }

    return screensWithGuarded.map((value) => {
      return routeToScreen(value.route, value.props, value.isGuarded, value.routeSource);
    });
  }, [sorted, guardedRedirects]);
}

function fromImport(
  value: RouteNode,
  { ErrorBoundary, SuspenseFallback, ...component }: LoadedRoute
) {
  // If possible, add a more helpful display name for the component stack to improve debugging of React errors such as `Text strings must be rendered within a <Text> component.`.
  if (component?.default && __DEV__) {
    component.default.displayName ??= `${component.default.name ?? 'Route'}(${value.contextKey})`;
  }

  if (ErrorBoundary) {
    const Wrapped = React.forwardRef((props: any, ref: any) => {
      const children = React.createElement(component.default || EmptyRoute, {
        ...props,
        ref,
      });
      return <Try catch={ErrorBoundary}>{children}</Try>;
    });

    if (__DEV__) {
      Wrapped.displayName = `ErrorBoundary(${value.contextKey})`;
    }

    return {
      default: Wrapped,
      SuspenseFallback,
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    if (
      typeof component.default === 'object' &&
      component.default &&
      Object.keys(component.default).length === 0
    ) {
      return { default: EmptyRoute, SuspenseFallback };
    }
  }

  return { default: component.default!, SuspenseFallback };
}

// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap<RouteNode, React.ComponentType<any>>();

/** Wrap the component with various enhancements and add access to child routes. */
export function getQualifiedRouteComponent(value: RouteNode) {
  if (qualifiedStore.has(value)) {
    return qualifiedStore.get(value)!;
  }

  let ScreenComponent: React.ComponentType<any>;
  let LayoutSuspenseFallback: React.ComponentType<SuspenseFallbackProps> | undefined;

  // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
  if (EXPO_ROUTER_IMPORT_MODE === 'lazy') {
    ScreenComponent = React.lazy<React.ComponentType<any>>(() => {
      const res = value.loadRoute() as LoadedRoute | PromiseLike<LoadedRoute>;
      // NOTE(@kitten): React.lazy supports promise likes, which we can use to ensure that
      // the route is synchronously available, if the `loadRoute` method returns a loaded route
      // synchronously
      if (!('then' in res)) {
        return {
          then(resolve) {
            const ret = fromImport(value, res);
            return Promise.resolve(resolve ? resolve(ret) : ret);
          },
        } as PromiseLike<{ default: React.ComponentType<any> }>;
      } else {
        return res.then(fromImport.bind(null, value));
      }
    });

    if (__DEV__) {
      ScreenComponent.displayName = `AsyncRoute(${value.route})`;
    }
  } else {
    const res = value.loadRoute() as LoadedRoute;
    const result = fromImport(value, res);
    ScreenComponent = result.default!;
    LayoutSuspenseFallback = value.type === 'layout' ? result.SuspenseFallback : undefined;
  }
  const WrappedScreenComponent: typeof ScreenComponent = (props: object) => {
    useColorSchemeChangesIfNeeded();
    return <ScreenComponent {...props} />;
  };
  function BaseRoute({
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route,
    navigation,

    // Pass all other props to the component
    ...props
  }: {
    route?: RouteProp<ParamListBase, string>;
    navigation: Omit<
      NavigationProp<
        ParamListBase,
        string,
        undefined,
        NavigationState,
        object,
        NativeStackNavigationEventMap | BottomTabNavigationEventMap
      >,
      'getState'
    > & {
      getState(): NavigationState | undefined;
    };
  }) {
    const stateForPath = useStateForPath();
    const isFocused = navigation.isFocused();
    const store = useExpoRouterStore();
    const InheritedSuspenseFallback = use(SuspenseFallbackContext);
    const guardRedirect = useGuardRedirect(value.route);

    const ResolvedSuspenseFallback =
      EXPO_ROUTER_IMPORT_MODE === 'lazy'
        ? DefaultSuspenseFallback
        : (LayoutSuspenseFallback ?? InheritedSuspenseFallback ?? DefaultSuspenseFallback);
    const providedSuspenseFallback =
      value.type === 'layout'
        ? (LayoutSuspenseFallback ?? InheritedSuspenseFallback)
        : InheritedSuspenseFallback;

    if (isFocused && !guardRedirect) {
      const state = navigation.getState();
      const isLeaf = !(state && 'state' in state.routes[state.index]!);
      if (isLeaf && stateForPath) store.setFocusedState(stateForPath);
    }

    useEffect(
      () =>
        navigation.addListener('focus', () => {
          const state = navigation.getState();
          const isLeaf = !(state && 'state' in state.routes[state.index]!);
          // Because setFocusedState caches the route info, this call will only trigger rerenders
          // if the component itself didn’t rerender and the route info changed.
          // Otherwise, the update from the `if` above will handle it,
          // and this won’t cause a redundant second update.
          if (isLeaf && stateForPath && !guardRedirect) store.setFocusedState(stateForPath);
        }),
      [navigation, guardRedirect]
    );

    useEffect(() => {
      return navigation.addListener('transitionEnd', (e) => {
        if (!e?.data?.closing) {
          // When navigating to a screen, remove the no animation param to re-enable animations
          // Otherwise the navigation back would also have no animation
          if (hasParam(route?.params, INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME)) {
            navigation.replaceParams(
              removeParams(route?.params, [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME])
            );
          }
        }
      });
    }, [navigation]);

    const isRouteType = value.type === 'route';
    const hasRouteKey = !!route?.key;

    if (guardRedirect) {
      return (
        <Route node={value} params={route?.params}>
          <Redirect href={guardRedirect} />
        </Route>
      );
    }

    return (
      <Route node={value} params={route?.params}>
        <SuspenseFallbackContext value={providedSuspenseFallback}>
          {unstable_navigationEvents.isEnabled() && isRouteType && hasRouteKey && (
            <AnalyticsListeners navigation={navigation} screenId={route.key} />
          )}
          <ZoomTransitionTargetContextProvider route={route}>
            <ZoomTransitionEnabler route={route} />
            <React.Suspense
              name={route ? `Route(${route.name})` : undefined}
              fallback={
                <ResolvedSuspenseFallback
                  route={value.contextKey}
                  params={(route?.params ?? {}) as SuspenseFallbackProps['params']}
                />
              }>
              <WrappedScreenComponent
                {...props}
                // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
                // the intention is to make it possible to deduce shared routes.
                segment={value.route}
              />
            </React.Suspense>
          </ZoomTransitionTargetContextProvider>
        </SuspenseFallbackContext>
      </Route>
    );
  }

  if (__DEV__) {
    BaseRoute.displayName = `Route(${value.route})`;
  }

  qualifiedStore.set(value, BaseRoute);
  return BaseRoute;
}

function AnalyticsListeners({
  navigation,
  screenId,
}: {
  navigation: EventConsumer<EventMapBase> & {
    isFocused(): boolean;
  };
  screenId: string;
}) {
  const isFirstRenderRef = React.useRef(true);
  const hasBlurredRef = React.useRef(true);
  const routeInfo = useCurrentRouteInfo();

  const isFocused = navigation.isFocused();

  if (isFirstRenderRef.current) {
    isFirstRenderRef.current = false;
    if (routeInfo && !isFocused) {
      unstable_navigationEvents.emit('pagePreloaded', {
        pathname: routeInfo.pathname,
        params: routeInfo.params,
        segments: routeInfo.segments,
        screenId,
      });
    }
  }

  useEffect(() => {
    if (routeInfo) {
      return () => {
        unstable_navigationEvents.emit('pageRemoved', {
          pathname: routeInfo.pathname,
          params: routeInfo.params,
          segments: routeInfo.segments,
          screenId,
        });
      };
    }
    return () => {};
  }, [routeInfo?.params, routeInfo?.pathname, routeInfo?.segments, screenId]);

  // Emit `pageFocused` from an effect — not during render — so it fires after the
  // focused screen's content has committed. `hasBlurredRef` deduplicates across both paths.
  useEffect(() => {
    if (isFocused && routeInfo && hasBlurredRef.current) {
      unstable_navigationEvents.emit('pageFocused', {
        pathname: routeInfo.pathname,
        params: routeInfo.params,
        segments: routeInfo.segments,
        screenId,
      });
      hasBlurredRef.current = false;
    }
  }, [isFocused, routeInfo?.pathname, routeInfo?.params, routeInfo?.segments, screenId]);

  useEffect(() => {
    if (routeInfo) {
      const cleanFocus = navigation.addListener('focus', () => {
        // If the screen was not blurred, don't emit focused again
        // hasBlurredRef will be false when the screen was initially focused
        if (hasBlurredRef.current) {
          unstable_navigationEvents.emit('pageFocused', {
            pathname: routeInfo.pathname,
            params: routeInfo.params,
            segments: routeInfo.segments,
            screenId,
          });
          hasBlurredRef.current = false;
        }
      });
      const cleanBlur = navigation.addListener('blur', () => {
        unstable_navigationEvents.emit('pageBlurred', {
          pathname: routeInfo.pathname,
          params: routeInfo.params,
          segments: routeInfo.segments,
          screenId,
        });
        hasBlurredRef.current = true;
      });
      return () => {
        cleanFocus();
        cleanBlur();
      };
    }
    return () => {};
  }, [navigation, routeInfo?.pathname, routeInfo?.params, routeInfo?.segments, screenId]);

  return null;
}

export function screenOptionsFactory(
  route: RouteNode,
  options?: ScreenProps['options'],
  isGuarded?: boolean
): ScreenProps['options'] {
  return (args) => {
    // Only eager load generated components
    const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
    const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
    const dynamicResult = typeof options === 'function' ? options?.(args) : options;
    const output = {
      ...staticResult,
      ...dynamicResult,
    };

    // Prevent generated screens from showing up in the tab bar.
    if (route.internal || isGuarded) {
      output.tabBarItemStyle = { display: 'none' };
      output.tabBarButton = () => null;
      // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
      output.drawerItemStyle = { height: 0, display: 'none' };
      output.hidden = true;
    }

    return output;
  };
}

// TODO: Refactor to take a single named-args object instead of positional params.
export function routeToScreen(
  route: RouteNode,
  { options, getId, ...props }: Partial<ScreenProps> = {},
  isGuarded?: boolean,
  routeSource?: RouteSource
) {
  return (
    <Screen
      {...props}
      name={route.route}
      key={route.route}
      getId={getId}
      routeSource={routeSource}
      options={screenOptionsFactory(route, options, isGuarded)}
      getComponent={() => getQualifiedRouteComponent(route)}
    />
  );
}

export function getSingularId(name: string, options: Record<string, any> = {}) {
  return name
    .split('/')
    .map((segment) => {
      if (segment.startsWith('[...')) {
        return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
      } else if (segment.startsWith('[') && segment.endsWith(']')) {
        return options.params?.[segment.slice(1, -1)] || segment;
      } else {
        return segment;
      }
    })
    .join('/');
}
