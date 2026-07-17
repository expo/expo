'use client';

import React, { use, useCallback, useMemo, useRef } from 'react';
import type { NavigatorArgs, NavigatorDescriptor, NavigatorRoute } from 'standard-navigation';

import { useRouteNode } from '../Route';
import { getNavigateAction } from '../global-state/getNavigationAction';
import {
  NavigatorTypeContext,
  useNavigatorTypeContextValue,
} from '../react-navigation/core/NavigatorTypeContext';
import { useStableTabOrder } from '../react-navigation/core/useStableTabOrder';
import { useStoreSlice } from '../react-navigation/core/useStoreSlice';
import type {
  NavigationAction,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
import { usePreloadRoutes } from '../react-navigation/usePreloadRoutes';
import { unstable_createStandardRouterNavigator } from '../standard-navigation';
import { getAllChildrenNotOfType, getAllChildrenOfType } from '../utils/children';
import { getRouteNodeHrefMap } from '../views/useSitemap';
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

interface NativeTabsCreatedProps {
  routesOrderNames: string[];
  lazyRoutes: NavigatorRoute[];
  lazyDescriptors: Record<string, NavigatorDescriptor<NativeTabOptions>>;
  preload: (name: string) => void;
  dispatch: (action: NavigationAction) => void;
  // React Navigation state key of this navigator (the standard-navigation `state` prop omits it).
  // Provided to `NavigatorTypeContext` so link-preview navigation can look through this tab.
  stateKey: string;
}

function NativeTabsContent({
  state,
  descriptors,
  actions,
  emitter,
  // Router-derived props (see `NativeTabsCreatedProps`). Pulled out of `rest` so they aren't
  // forwarded to `NativeTabsView`.
  routesOrderNames,
  lazyRoutes,
  lazyDescriptors,
  preload,
  dispatch,
  stateKey,
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
  NativeTabsCreatedProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const { routes } = state;
  const routeNode = useRouteNode();
  const hrefMap = useMemo(() => getRouteNodeHrefMap(), [routeNode]);
  const committedState = useStoreSlice(stateKey);

  // TODO: Consider supporting lazy routes here (preload only non-lazy tabs, like the JS navigators)
  // instead of always mounting every tab - would defer offscreen tab cost on the native side.
  const preloadNavigation = useMemo(() => ({ preload, dispatch }), [preload, dispatch]);
  // Resolve each tab's compiled href so the preload carries its subtree (same lookup `onTabChange`
  // uses for first-visit navigation below).
  const resolveHref = useCallback(
    (name: string) => {
      const child = routeNode?.children.find((candidate) => candidate.route === name);
      return child ? hrefMap.get(child) : undefined;
    },
    [routeNode, hrefMap]
  );
  // The standard-navigation `state` omits its key; `stateKey` carries it (see `NativeTabsCreatedProps`).
  usePreloadRoutes(
    { routes: state.routes, key: stateKey },
    preloadNavigation,
    routesOrderNames,
    resolveHref
  );

  const combinedDescriptors = useMemo(
    () => ({ ...lazyDescriptors, ...descriptors }),
    [lazyDescriptors, descriptors]
  );
  const combinedRoutes = useMemo(() => [...lazyRoutes, ...routes], [lazyRoutes, routes]);
  const orderedRoutes = useStableTabOrder(routesOrderNames, combinedRoutes);

  const visibleTabs = useMemo(
    () =>
      orderedRoutes
        // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
        // If it is not defined, then it was not specified, and we should hide the tab.
        .filter((route) => combinedDescriptors[route.key]!.options?.hidden !== true)
        .map(
          (route): NativeTabsViewTabItem => ({
            options: combinedDescriptors[route.key]!.options,
            routeKey: route.key,
            name: route.name,
            contentRenderer: () => combinedDescriptors[route.key]!.render(),
          })
        ),
    [orderedRoutes, combinedDescriptors]
  );
  const visibleFocusedTabIndex = useMemo(
    () => visibleTabs.findIndex((tab) => tab.routeKey === routes[state.index]!.key),
    [visibleTabs, routes, state.index]
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
        // Resolve against `orderedRoutes`, not `state.routes`: tapping a not-yet-materialized tab
        // hands back a lazy key that isn't in `state.routes` yet.
        const selectedRoute = orderedRoutes.find((route) => route.key === selectedKey);
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
        const child = routeNode?.children.find(
          (candidate) => candidate.route === selectedRoute.name
        );
        const href = child ? hrefMap.get(child) : undefined;
        const committedRoute = committedState?.routes.find(
          (route) => route.key === selectedRoute.key
        );
        const firstVisitAction =
          committedRoute?.state == null && href != null ? getNavigateAction(href, {}) : undefined;

        if (firstVisitAction != null) {
          dispatch(firstVisitAction);
        } else {
          actions.navigate(selectedRoute.name);
        }
      }
    },
    [orderedRoutes, actions, committedState, dispatch, emitter, hrefMap, routeNode]
  );

  // Compile-time guard: everything spread onto `<NativeTabsView>` must be a prop it declares. The
  // `Record<…, never>` turns any prop the view doesn't accept into a type error here instead of
  // letting it leak silently through the spread.
  const nativeTabsViewProps: Omit<
    NativeTabsViewProps,
    'focusedIndex' | 'provenance' | 'tabs' | 'onTabChange'
  > &
    Record<Exclude<keyof typeof rest, keyof NativeTabsViewProps>, never> = rest;

  const navigatorTypeValue = useNavigatorTypeContextValue('tab', stateKey);

  return (
    <NavigatorTypeContext value={navigatorTypeValue}>
      <NativeTabsContext value>
        <NativeTabsView
          {...nativeTabsViewProps}
          focusedIndex={focusedIndex}
          // Provenance should only be sent with updates, and updates
          // on JS side are only triggered by rerender, so passing ref
          // here is ok.
          provenance={provenanceRef.current}
          tabs={visibleTabs}
          onTabChange={onTabChange}
        />
      </NativeTabsContext>
    </NavigatorTypeContext>
  );
}

const NativeTabsNavigatorWithContext = unstable_createStandardRouterNavigator<
  NativeTabOptions,
  TabNavigationState<ParamListBase>,
  NativeTabNavigationEventMap,
  Omit<InternalNativeTabsProps, 'screenListeners'>,
  TabRouterOptions,
  NativeTabsCreatedProps
>(NativeTabsContent, NativeBottomTabsRouter, {
  // Trigger routes are runtime knowledge, so this navigator's `routeNames` can be a subset of what
  // the compiler emitted for this level (all sibling files). On a seeded mount with non-trigger
  // siblings, `useNavigationBuilder` dispatches one legitimate `RECONCILE_ROUTE_NAMES` repair (the
  // route-names-change branch of `getStateForAction`) — a deliberate exception to Step 3's "seed
  // commits verbatim" contract until the seed and triggers are reconciled (global-state RFC, Steps
  // 6/10). `usePreloadRoutes` self-heals any preload that repair clobbers.
  useOnlyUserDefinedScreens: true,
  createProps: ({ state, dispatch, describe, getKey }) => {
    const { routeNames, routes } = state;
    const presentNames = new Set(routes.map((route) => route.name));
    const lazyRoutes: NavigatorRoute[] = routeNames
      .filter((name) => !presentNames.has(name))
      .map((name) => ({ key: getKey(name), name, href: undefined }));
    return {
      routesOrderNames: routeNames,
      lazyRoutes,
      // TODO(@ubax): This is a breaking change - before all tabs did render on the first render
      // Add a deprecated prop, which will bring the old behavior back to simplify the migration path
      lazyDescriptors: Object.fromEntries(
        lazyRoutes.map((route) => [route.key, { ...describe(route, true), render: () => null }])
      ),
      preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
      dispatch,
      stateKey: state.key,
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
  const navigatorKey = useMemo(
    () => triggerChildren.map((child) => `${child.props.name}:${child.props.hidden}`).join(','),
    [triggerChildren]
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
      key={navigatorKey}
      children={triggerChildren}
      nonTriggerChildren={nonTriggerChildren}
      screenOptions={screenOptions}
      // Passed to TabRouter
      backBehavior={backBehavior}
    />
  );
}
