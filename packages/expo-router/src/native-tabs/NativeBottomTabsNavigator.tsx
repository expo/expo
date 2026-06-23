'use client';

import React, { use, useCallback, useMemo, useRef } from 'react';
import type { NavigatorArgs } from 'standard-navigation';

import type {
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
import { getRouteKey } from '../react-navigation/routers/getRouteKey';
import { usePreloadRoutes } from '../react-navigation/usePreloadRoutes';
import { unstable_createStandardRouterNavigator } from '../standard-navigation';
import { getAllChildrenNotOfType, getAllChildrenOfType } from '../utils/children';
import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabTrigger } from './NativeTabTrigger';
import { NativeTabsView } from './NativeTabsView';
import type {
  InternalNativeTabsProps,
  NativeTabNavigationEventMap,
  NativeTabOptions,
  NativeTabsProps,
  NativeTabsViewProps,
  NativeTabsViewTabItem,
  OnTabChangeEventPayload,
} from './types';
import { convertIconColorPropToObject, convertLabelStylePropToObject } from './utils';

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
export const NativeTabsContext = React.createContext<boolean>(false);

const noop = () => {};

// A declared tab as `{ name, key }`. A not-yet-materialized tab carries the deterministic key the
// router will assign once it's preloaded, so its native screen reconciles in place instead of
// remounting when the real route lands.
type NativeTabRoute = { name: string; key: string };

// Router-specific data the standard-navigation integration computes from navigation state (via
// `createProps`) and injects into `NativeTabsContent`. The standard `state` only carries the routes
// that are currently present; native tabs need the full declared set and a preload handle, neither
// of which the standard contract projects.
//
// Declared optional so they aren't required on the `<NativeTabs>` element (it's rendered without
// them); the content always receives them at runtime.
interface NativeTabsRouterProps {
  // Every declared tab in declaration order, so the bar renders in a stable order regardless of the
  // back-stack order of `state.routes`. Includes tabs that haven't materialized yet.
  routesOrder?: NativeTabRoute[];
  // Declared tabs not yet present in `state.routes`; rendered as placeholder slots until preloaded.
  lazyLoadedRoutes?: NativeTabRoute[];
  // Preload a tab by name (appends it to `state.routes` without moving focus).
  preload?: (name: string) => void;
}

// Recover the navigator's pathname from a present route's deterministic key
// (`getRouteKey(pathname, name)`), so keys for not-yet-materialized tabs can be derived without a
// hook. Tab names are unique within a navigator, so every present key is the index-0 form.
function getNavigatorPathname(
  routes: readonly { key: string; name: string }[]
): string | undefined {
  const route = routes[0];
  if (!route || route.key === route.name) {
    return undefined;
  }
  // Strip the trailing `-${name}` to leave the pathname prefix.
  return route.key.slice(0, route.key.length - route.name.length - 1);
}

function NativeTabsContent({
  state,
  descriptors,
  actions,
  emitter,
  // Router-derived props (see `NativeTabsRouterProps`). Pulled out of `rest` so they aren't
  // forwarded to `NativeTabsView`.
  routesOrder = [],
  lazyLoadedRoutes = [],
  preload,
  // These per-tab style props are folded into `screenOptions` by `NativeTabsNavigatorWrapper` and
  // read back per-tab from `descriptors`. Pull them out of `rest` so they aren't forwarded to
  // `NativeTabsView` as top-level props.
  labelStyle,
  iconColor,
  backgroundColor,
  badgeBackgroundColor,
  blurEffect,
  indicatorColor,
  badgeTextColor,
  rippleColor,
  disableIndicator,
  labelVisibilityMode,
  ...rest
}: NavigatorArgs<NativeTabOptions, NativeTabNavigationEventMap> &
  Omit<InternalNativeTabsProps, 'screenListeners'> &
  NativeTabsRouterProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const { routes } = state;

  // Native tabs are fully eager: every declared tab must mount, so preload them all. A tab's
  // presence in `state.routes` is the loaded signal; `lazyLoadedRoutes` covers the gap by rendering
  // placeholder slots for any tab not present yet, so the bar is complete from the first frame.
  // TODO: Consider supporting lazy routes here (preload only non-lazy tabs, like the JS navigators)
  // instead of always mounting every tab — would defer offscreen tab cost on the native side.
  const routeNamesToPreload = useMemo(
    () => routesOrder.map((route) => route.name),
    [routesOrder]
  );
  const preloadNavigation = useMemo(() => ({ preload: preload ?? noop }), [preload]);
  usePreloadRoutes(state, preloadNavigation, routeNamesToPreload);

  const lazyRouteKeys = useMemo(
    () => new Set(lazyLoadedRoutes.map((route) => route.key)),
    [lazyLoadedRoutes]
  );

  const visibleTabs = useMemo(
    () =>
      routesOrder
        .filter((route) => {
          // Not-yet-materialized tabs have no descriptor; always show them so the bar is complete.
          if (lazyRouteKeys.has(route.key)) {
            return true;
          }
          // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
          // If it is not defined, then it was not specified, and we should hide the tab.
          return descriptors[route.key]!.options?.hidden !== true;
        })
        .map((route): NativeTabsViewTabItem => {
          if (lazyRouteKeys.has(route.key)) {
            // Placeholder slot: reserves the tab under the deterministic key so the real route
            // reconciles onto it once preloaded. Renders nothing and carries no options until then.
            return {
              options: {},
              routeKey: route.key,
              name: route.name,
              contentRenderer: () => null,
            };
          }
          return {
            options: descriptors[route.key]!.options,
            routeKey: route.key,
            name: route.name,
            contentRenderer: () => descriptors[route.key]!.render(),
          };
        }),
    [routesOrder, lazyRouteKeys, descriptors]
  );
  const visibleFocusedTabIndex = useMemo(
    () => visibleTabs.findIndex((tab) => tab.routeKey === state.routes[state.index]!.key),
    [visibleTabs, state.routes, state.index]
  );
  const visibleTabsKeys = useMemo(
    () => visibleTabs.map((tab) => tab.routeKey).join(';'),
    [visibleTabs]
  );

  if (visibleFocusedTabIndex < 0) {
    if (process.env.NODE_ENV !== 'production') {
      const focusedRoute = routes[state.index];
      throw new Error(
        `The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Route: "${focusedRoute?.href ?? focusedRoute?.name}"`
      );
    }
  }
  const focusedIndex = visibleFocusedTabIndex >= 0 ? visibleFocusedTabIndex : 0;
  const provenanceRef = useRef(0);

  const onTabChange = useCallback(
    ({ selectedKey, provenance, isNativeAction, isPrevented = false }: OnTabChangeEventPayload) => {
      if (isPrevented) {
        // The native side blocked selecting a disabled tab. Notify listeners, but
        // don't advance navigation or acknowledge a (non-existent) state transition,
        // so the provenance counter is left untouched.
        emitter.emit({
          type: 'tabPress',
          target: selectedKey,
          data: {
            __internalTabsType: 'native',
            isPrevented: true,
          },
        });
        return;
      }

      // We should always send the last provenance we got from native side
      provenanceRef.current = provenance;

      if (isNativeAction) {
        // Resolve against `routesOrder`, not `state.routes`: tapping a not-yet-materialized tab
        // hands back a placeholder key that isn't in `state.routes` yet.
        const selectedRoute = routesOrder.find((route) => route.key === selectedKey);
        if (!selectedRoute) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `NativeTabs received a native tab change for an unknown tab (key: "${selectedKey}"), so the change was ignored. ` +
                `This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
            );
          }
          return;
        }
        emitter.emit({
          type: 'tabPress',
          target: selectedKey,
          data: {
            __internalTabsType: 'native',
            isPrevented: false,
          },
        });
        actions.navigate(selectedRoute.name);
      }
    },
    [routesOrder, actions, emitter]
  );

  // Compile-time guard: everything spread onto `<NativeTabsView>` must be a prop it declares. The
  // `Record<…, never>` turns any prop the view doesn't accept into a type error here instead of
  // letting it leak silently through the spread.
  const nativeTabsViewProps: Omit<
    NativeTabsViewProps,
    'focusedIndex' | 'provenance' | 'tabs' | 'onTabChange'
  > &
    Record<Exclude<keyof typeof rest, keyof NativeTabsViewProps>, never> = rest;

  return (
    <NativeTabsContext value>
      <NativeTabsView
        {...nativeTabsViewProps}
        key={visibleTabsKeys}
        focusedIndex={focusedIndex}
        // Provenance should only be sent with updates, and updates
        // on JS side are only triggered by rerender, so passing ref
        // here is ok.
        provenance={provenanceRef.current}
        tabs={visibleTabs}
        onTabChange={onTabChange}
      />
    </NativeTabsContext>
  );
}

const NativeTabsNavigatorWithContext = unstable_createStandardRouterNavigator<
  NativeTabOptions,
  TabNavigationState<ParamListBase>,
  NativeTabNavigationEventMap,
  Omit<InternalNativeTabsProps, 'screenListeners'> & NativeTabsRouterProps,
  TabRouterOptions
>(NativeTabsContent, NativeBottomTabsRouter, {
  useOnlyUserDefinedScreens: true,
  // Reconcile the router state with what native tabs need: the full declared tab set in declaration
  // order, the not-yet-materialized subset (for placeholder slots), and a preload handle. All are
  // pure functions of `state`; the eager-preload effect itself lives in `NativeTabsContent`.
  createProps: ({ state, dispatch }) => {
    const { routeNames, routes } = state;
    const pathname = getNavigatorPathname(routes);
    const presentByName = new Map(routes.map((route) => [route.name, route]));
    return {
      routesOrder: routeNames.map((name) => ({
        name,
        key: presentByName.get(name)?.key ?? getRouteKey(pathname, name),
      })),
      lazyLoadedRoutes: routeNames
        .filter((name) => !presentByName.has(name))
        .map((name) => ({ name, key: getRouteKey(pathname, name) })),
      preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
    };
  },
});

export function NativeTabsNavigatorWrapper(props: NativeTabsProps) {
  const triggerChildren = useMemo(
    () =>
      getAllChildrenOfType(props.children, NativeTabTrigger).filter((child) => !child.props.hidden),
    [props.children]
  );
  const nonTriggerChildren = useMemo(
    () => getAllChildrenNotOfType(props.children, NativeTabTrigger),
    [props.children]
  );

  const {
    backBehavior = defaultBackBehavior,
    labelStyle,
    iconColor,
    blurEffect,
    backgroundColor,
    badgeBackgroundColor,
    indicatorColor,
    badgeTextColor,
    shadowColor,
    rippleColor,
    disableIndicator,
    labelVisibilityMode,
    tintColor,
    disableTransparentOnScrollEdge,
  } = props;

  const screenOptions = useMemo(() => {
    const processedLabelStyle = convertLabelStylePropToObject(labelStyle);
    const processedIconColor = convertIconColorPropToObject(iconColor);

    const selectedLabelStyle = processedLabelStyle.selected
      ? {
          ...processedLabelStyle.selected,
          color: processedLabelStyle.selected.color ?? tintColor,
        }
      : tintColor
        ? { color: tintColor }
        : undefined;

    return {
      disableTransparentOnScrollEdge,
      labelStyle: processedLabelStyle.default,
      selectedLabelStyle,
      iconColor: processedIconColor.default,
      selectedIconColor: processedIconColor.selected ?? tintColor,
      blurEffect,
      backgroundColor,
      badgeBackgroundColor,
      indicatorColor,
      badgeTextColor,
      shadowColor,
      rippleColor,
      disableIndicator,
      labelVisibilityMode,
      tintColor,
    };
  }, [
    labelStyle,
    iconColor,
    blurEffect,
    backgroundColor,
    badgeBackgroundColor,
    indicatorColor,
    badgeTextColor,
    shadowColor,
    rippleColor,
    disableIndicator,
    labelVisibilityMode,
    tintColor,
    disableTransparentOnScrollEdge,
  ]);

  return (
    <NativeTabsNavigatorWithContext
      {...props}
      children={triggerChildren}
      nonTriggerChildren={nonTriggerChildren}
      screenOptions={screenOptions}
      // Passed to TabRouter
      backBehavior={backBehavior}
    />
  );
}
