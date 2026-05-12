'use client';

import React, { use, useCallback, useMemo, useRef } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { convertTabPropsToOptions, NativeTabTrigger } from './NativeTabTrigger';
import { NativeTabsView } from './NativeTabsView';
import type {
  InternalNativeTabsProps,
  NativeTabNavigationEventMap,
  NativeTabOptions,
  NativeTabTriggerProps,
  NativeTabsProps,
  NativeTabsViewTabItem,
  OnTabChangeEventPayload,
} from './types';
import { convertIconColorPropToObject, convertLabelStylePropToObject } from './utils';
import { useContextKey } from '../Route';
import { withLayoutContext } from '../layouts/withLayoutContext';
import { getPathFromState } from '../link/linking';
import type {
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
import { createNavigatorFactory, useNavigationBuilder } from '../react-navigation/native';
import type { ScreenProps } from '../useScreens';
import { getAllChildrenNotOfType, getAllChildrenOfType } from '../utils/children';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
export const NativeTabsContext = React.createContext<boolean>(false);

export function NativeTabsNavigator({
  children,
  backBehavior = defaultBackBehavior,
  labelStyle,
  iconColor,
  blurEffect,
  backgroundColor,
  badgeBackgroundColor,
  indicatorColor,
  badgeTextColor,
  shadowColor,
  screenListeners,
  ...rest
}: InternalNativeTabsProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const processedLabelStyle = convertLabelStylePropToObject(labelStyle);
  const processedIconColor = convertIconColorPropToObject(iconColor);

  const selectedLabelStyle = processedLabelStyle.selected
    ? {
        ...processedLabelStyle.selected,
        color: processedLabelStyle.selected.color ?? rest.tintColor,
      }
    : rest.tintColor
      ? { color: rest.tintColor }
      : undefined;

  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    Record<string, (...args: unknown[]) => void>,
    NativeTabOptions,
    NativeTabNavigationEventMap
  >(NativeBottomTabsRouter, {
    children,
    backBehavior,
    screenListeners,
    screenOptions: {
      disableTransparentOnScrollEdge: rest.disableTransparentOnScrollEdge,
      labelStyle: processedLabelStyle.default,
      selectedLabelStyle,
      iconColor: processedIconColor.default,
      selectedIconColor: processedIconColor.selected ?? rest.tintColor,
      blurEffect,
      backgroundColor,
      badgeBackgroundColor,
      indicatorColor,
      badgeTextColor,
      shadowColor,
    },
  });

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
      throw new Error(
        `The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${getPathFromState(state)}"`
      );
    }
  }
  const focusedIndex = visibleFocusedTabIndex >= 0 ? visibleFocusedTabIndex : 0;
  const provenanceRef = useRef(0);

  const onTabChange = useCallback(
    ({ selectedKey, provenance, isNativeAction }: OnTabChangeEventPayload) => {
      // We should always send the last provenance we got from native side
      provenanceRef.current = provenance;

      if (isNativeAction) {
        const { route } = descriptors[selectedKey]!;
        navigation.emit({
          type: 'tabPress',
          target: selectedKey,
          data: {
            __internalTabsType: 'native',
          },
        });
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: route.name,
          },
        });
      }
    },
    [descriptors, navigation, state.key]
  );

  return (
    <NavigationContent>
      <NativeTabsContext value>
        <NativeTabsView
          {...rest}
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
    </NavigationContent>
  );
}

const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

const NativeTabsNavigatorWithContext = withLayoutContext<
  NativeTabOptions,
  typeof NativeTabsNavigator,
  TabNavigationState<ParamListBase>,
  NativeTabNavigationEventMap
>(createNativeTabNavigator().Navigator, undefined, true);

const TriggerScreen = Screen as React.ComponentType<
  ScreenProps<NativeTabOptions, TabNavigationState<ParamListBase>, NativeTabNavigationEventMap>
>;

function convertNativeTabTriggerToScreen(
  child: React.ReactElement<NativeTabTriggerProps>,
  contextKey?: string
) {
  const { name, listeners } = child.props;
  if (!name) {
    throw new Error(
      `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    if ((['component', 'getComponent'] as const).some((key) => key in child.props)) {
      throw new Error(
        `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`
      );
    }
  }

  const options = convertTabPropsToOptions(child.props);
  if (options.hidden === false) {
    return <TriggerScreen key={name} name={name} options={options} listeners={listeners} />;
  }

  return (
    <Protected key={name} guard={false}>
      <Screen name={name} />
    </Protected>
  );
}

export function NativeTabsNavigatorWrapper(props: NativeTabsProps) {
  const contextKey = useContextKey();
  const triggerChildren = useMemo(
    () => getAllChildrenOfType(props.children, NativeTabTrigger),
    [props.children]
  );
  const triggerScreens = useMemo(
    () => triggerChildren.map((child) => convertNativeTabTriggerToScreen(child, contextKey)),
    [contextKey, triggerChildren]
  );
  const nonTriggerChildren = useMemo(
    () => getAllChildrenNotOfType(props.children, NativeTabTrigger),
    [props.children]
  );

  return (
    <NativeTabsNavigatorWithContext
      {...props}
      children={triggerScreens}
      nonTriggerChildren={nonTriggerChildren}
    />
  );
}
