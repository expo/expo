'use client';

import React, { use, useCallback, useMemo, useRef } from 'react';
import type { NavigatorArgs } from 'standard-navigation';

import type {
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
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

function NativeTabsContent({
  state,
  descriptors,
  actions,
  emitter,
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
  Omit<InternalNativeTabsProps, 'screenListeners'>) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const { routes } = state;

  const visibleTabs = useMemo(
    () =>
      routes
        // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
        // If it is not defined, then it was not specified, and we should hide the tab.
        .filter((route) => descriptors[route.key]!.options?.hidden !== true)
        .map(
          (route): NativeTabsViewTabItem => ({
            options: descriptors[route.key]!.options,
            routeKey: route.key,
            name: route.name,
            contentRenderer: () => descriptors[route.key]!.render(),
          })
        ),
    [routes, descriptors]
  );
  const visibleFocusedTabIndex = useMemo(
    () => visibleTabs.findIndex((tab) => tab.routeKey === routes[state.index]!.key),
    [visibleTabs, routes, state.index]
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
        const selectedRoute = routes.find((route) => route.key === selectedKey);
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
    [routes, actions, emitter]
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
  Omit<InternalNativeTabsProps, 'screenListeners'>,
  TabRouterOptions
>(NativeTabsContent, NativeBottomTabsRouter, { useOnlyUserDefinedScreens: true });

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
