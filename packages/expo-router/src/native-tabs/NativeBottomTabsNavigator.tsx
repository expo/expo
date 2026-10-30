'use client';

import React, {
  Children,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { createBaseTabProps } from '../layouts/createBaseTabProps';
import {
  CommonActions,
  type ParamListBase,
  type TabNavigationState,
  type TabRouterOptions,
} from '../react-navigation/native';
import { IsWithinNativeNavigator, createStandardRouterNavigator } from '../standard-navigation';
import {
  appendMissingPlaceholderTabDescriptors,
  appendMissingPlaceholderTabRoutes,
} from '../standard-navigation/appendMissingPlaceholderTabRoutes';
import type {
  StandardNavigatorContentProps,
  StandardNavigatorCreatePropsFactoryDeps,
} from '../standard-navigation/types';
import { usePreloadPlaceholderRoutes } from '../standard-navigation/usePreloadPlaceholderRoutes';
import { useVisibleTabsWithRedirect } from '../standard-navigation/useVisibleTabsWithRedirect';
import { useWarnOnce } from '../useDeprecated';
import { isChildOfType } from '../utils/children';
import { isProtectedReactElement } from '../views/Protected';
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

export interface NativeTabsNavigatorCreateProps {
  isPreloaded: (key: string) => boolean;
  isRemovalPrevented: (key: string) => boolean;
  routeNames: string[];
  preload: (name: string) => void;
  navigateSync: (name: string) => void;
}

/**
 * Creates the props required to integrate Expo Router's native tabs navigator.
 *
 * @param args The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The native tabs navigator props.
 *
 * @example
 * ```tsx
 * import { TabRouter, integrateWithRouter } from 'expo-router';
 * import { createNativeTabsProps } from 'expo-router/unstable-native-tabs';
 * import { navigator } from './navigator';
 *
 * export const NativeTabs = integrateWithRouter(navigator, TabRouter, {
 *   createProps: createNativeTabsProps,
 * });
 * ```
 */
export function createNativeTabsProps(
  args: StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>
): NativeTabsNavigatorCreateProps {
  const { dispatchSync } = args;
  return {
    ...createBaseTabProps(args),
    navigateSync: (name) => dispatchSync(CommonActions.navigate(name)),
  };
}

// Store the previous key in state, so the warning sees the change, also in StrictMode.
function useWarnOnTabConfigurationChange(tabConfigurationKey: string) {
  const [tabKeys, setTabKeys] = useState({
    previous: tabConfigurationKey,
    current: tabConfigurationKey,
  });
  if (process.env.NODE_ENV !== 'production' && tabKeys.current !== tabConfigurationKey) {
    setTabKeys({ previous: tabKeys.current, current: tabConfigurationKey });
  }
  const formatTabs = (key: string) => `[${key.split(';').join(', ')}]`;
  useWarnOnce(
    `NativeTabs remounted and reset all tab state because the visible tabs changed from ${formatTabs(tabKeys.previous)} to ${formatTabs(tabKeys.current)}. ` +
      'To keep tab state, keep the same visible tabs, or move the condition to a parent layout, for example a `Protected` guard around the tabs layout.',
    tabKeys.previous !== tabKeys.current
  );
}

function NativeTabsContent({
  state,
  routeNames,
  descriptors,
  actions: _actions,
  emitter,
  preload,
  navigateSync,
  isPreloaded: _isPreloaded,
  isRemovalPrevented: _isRemovalPrevented,
  tabConfigurationKey,
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
}: StandardNavigatorContentProps<
  NativeTabOptions,
  NativeTabNavigationEventMap,
  Omit<InternalNativeTabsProps, 'screenListeners'>
> &
  NativeTabsNavigatorCreateProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const { routes } = state;

  const { visibleRoutes, focusedIndex, focusedFallbackRoute } = useVisibleTabsWithRedirect({
    routes,
    routeNames,
    focusedRouteKey: routes[state.index]?.key,
    descriptors,
  });
  const visibleTabs = useMemo(
    () =>
      visibleRoutes.map(
        (route): NativeTabsViewTabItem => ({
          options: descriptors[route.key]!.options,
          name: route.name,
          routeKey: route.key,
          contentRenderer: () => descriptors[route.key]!.render(),
        })
      ),
    [descriptors, visibleRoutes]
  );
  usePreloadPlaceholderRoutes({
    routes: visibleRoutes,
    descriptors,
    preload,
    lazyByDefault: false,
  });

  useWarnOnTabConfigurationChange(tabConfigurationKey);

  const provenanceRef = useRef(0);

  const onTabChange = useCallback(
    ({ selectedKey, provenance, isNativeAction, isPrevented = false }: OnTabChangeEventPayload) => {
      if (isPrevented) {
        // The native side blocked selecting a disabled tab. Notify listeners, but
        // don't advance navigation or acknowledge a (non-existent) state transition,
        // so the provenance counter is left untouched.
        emitter.emit({
          type: 'tabPress',
          target: routes.find((route) => route.name === selectedKey)?.key ?? selectedKey,
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
        const selectedRoute = routes.find((route) => route.name === selectedKey);
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
          target: selectedRoute.key,
          data: {
            __internalTabsType: 'native',
            isPrevented: false,
          },
        });
        navigateSync(selectedRoute.name);
      }
    },
    [routes, navigateSync, emitter]
  );

  // Compile-time guard: everything spread onto `<NativeTabsView>` must be a prop it declares. The
  // `Record<…, never>` turns any prop the view doesn't accept into a type error here instead of
  // letting it leak silently through the spread.
  const nativeTabsViewProps: Omit<
    NativeTabsViewProps,
    'focusedIndex' | 'provenance' | 'tabs' | 'onTabChange'
  > &
    Record<Exclude<keyof typeof rest, keyof NativeTabsViewProps>, never> = rest;

  if (focusedFallbackRoute) {
    return descriptors[focusedFallbackRoute.key]?.render() ?? null;
  }

  if (visibleTabs.length === 0 || focusedIndex < 0) {
    return null;
  }

  return (
    <NativeTabsContext value>
      <NativeTabsView
        {...nativeTabsViewProps}
        key={tabConfigurationKey}
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

const NativeTabsNavigatorWithContext = createStandardRouterNavigator<
  NativeTabOptions,
  TabNavigationState<ParamListBase>,
  NativeTabNavigationEventMap,
  Omit<InternalNativeTabsProps, 'screenListeners'>,
  TabRouterOptions,
  NativeTabsNavigatorCreateProps
>(NativeTabsContent, NativeBottomTabsRouter, {
  activityDefaultThreshold: 1,
  processDescriptors: appendMissingPlaceholderTabDescriptors,
  processState: appendMissingPlaceholderTabRoutes,
  createProps: createNativeTabsProps,
});

// `Protected` stays wrapped. The navigator's screen filter reads `guard` and records `redirectTo`.
function partitionNativeTabsChildren(children: ReactNode) {
  const navigatorChildren: ReactNode[] = [];
  const nonTriggerChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isChildOfType(child, NativeTabTrigger)) {
      if (!child.props.hidden) {
        navigatorChildren.push(child);
      }
      return;
    }

    if (isProtectedReactElement(child)) {
      navigatorChildren.push(child);
      return;
    }

    nonTriggerChildren.push(child);
  });

  return {
    navigatorChildren,
    nonTriggerChildren,
    tabConfigurationKey: getVisibleTriggerNames(children).join(';'),
  };
}

function getVisibleTriggerNames(children: ReactNode, excluded = false): string[] {
  return Children.toArray(children).flatMap((child) => {
    if (isProtectedReactElement(child)) {
      return getVisibleTriggerNames(child.props.children, excluded || !child.props.guard);
    }

    if (isChildOfType(child, NativeTabTrigger) && !excluded && !child.props.hidden) {
      return [child.props.name ?? ''];
    }

    return [];
  });
}

export function NativeTabsNavigatorWrapper(props: NativeTabsProps) {
  const { navigatorChildren, nonTriggerChildren, tabConfigurationKey } = useMemo(
    () => partitionNativeTabsChildren(props.children),
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
    <IsWithinNativeNavigator value>
      <NativeTabsNavigatorWithContext
        {...props}
        children={navigatorChildren}
        nonTriggerChildren={nonTriggerChildren}
        tabConfigurationKey={tabConfigurationKey}
        screenOptions={screenOptions}
        // Passed to TabRouter
        backBehavior={backBehavior}
      />
    </IsWithinNativeNavigator>
  );
}
