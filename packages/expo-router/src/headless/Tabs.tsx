import { PropsWithChildren, ReactNode } from 'react';
import { createNavigatorFactory } from '@react-navigation/core';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BottomTabNavigationConfig } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import {
  DefaultNavigatorOptions,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouter,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { TabsContext } from './Tabs.common';
import { RouteNode, useRouteNode } from '../Route';
import { getQualifiedRouteComponent } from '../useScreens';
import { resolveHref } from '../link/href';
import { Href, UnknownInputParams } from '../types';
import { shouldLinkExternally } from '../utils/url';

export * from './Tabs.slot';
export * from './Tabs.common';

export type UseTabsOptions = Omit<
  DefaultNavigatorOptions<
    ParamListBase,
    TabNavigationState<ParamListBase>,
    TabsScreenOptions,
    TabNavigationEventMap
  >,
  'children'
> &
  Omit<TabRouterOptions, 'initialRouteName'> & // Should be set through `unstable_settings`
  BottomTabNavigationConfig & {
    hrefs: HrefOptions;
  };

// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = createNavigatorFactory({} as any)();

export type TabsProps = PropsWithChildren<UseTabsOptions>;
export type TabsScreenOptions = BottomTabNavigationOptions;
export type TabNavigationEventMap = {
  /**
   * Event which fires on tapping on the tab in the tab bar.
   */
  tabPress: { data: undefined; canPreventDefault: true };
  /**
   * Event which fires on long press on the tab in the tab bar.
   */
  tabLongPress: { data: undefined };
};

export function useTabs({ hrefs, ...options }: UseTabsOptions) {
  const routeNode = useRouteNode();
  if (routeNode == null) {
    throw new Error('No RouteNode. This is likely a bug in expo-router.');
  }

  const children = hrefOptionsToScreens(routeNode, hrefs);

  return useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    BottomTabNavigationOptions,
    TabNavigationEventMap
  >(TabRouter, { children, ...options });
}

export function Tabs({ children, ...options }: TabsProps) {
  const tabsContext = useTabs(options);

  const NavigationContent = tabsContext.NavigationContent;

  return (
    <TabsContext.Provider value={tabsContext}>
      <NavigationContent>{children}</NavigationContent>
    </TabsContext.Provider>
  );
}

type HrefOptions = Record<string, object> | Array<Href | [Href, object]>;

function hrefOptionsToScreens(layoutRouteNode: RouteNode, hrefOptions: HrefOptions) {
  const hrefEntries: [Href, object][] = Array.isArray(hrefOptions)
    ? hrefOptions.map((option) => (Array.isArray(option) ? option : [option, {}]))
    : Object.entries(hrefOptions);

  return hrefEntries.reduce((acc, [href, options], index) => {
    if (
      typeof href === 'string' &&
      'params' in options &&
      typeof options.params === 'object' &&
      options.params
    ) {
      href = {
        pathname: href,
        params: options.params as UnknownInputParams,
      };
    }

    const routeNode = hrefToRouteNode(layoutRouteNode, href, index);

    // If the href isn't valid, skip it
    if (!routeNode) {
      return acc;
    }

    acc.push(
      <Screen
        key={routeNode.contextKey}
        name={`${index}`} // The name needs to be unique, but we don't actually use it
        getComponent={() => getQualifiedRouteComponent(routeNode)}
      />
    );

    return acc;
  }, [] as ReactNode[]);
}

function hrefToRouteNode(layoutRouteNode: RouteNode, href: Href, index: number) {
  href = resolveHref(href);

  if (shouldLinkExternally(href)) {
    return null;
  }

  // You cannot navigate outside this layout
  if (href.startsWith('..')) {
    return null;
  }

  // TODO: Properly resolve the routeNode
  return layoutRouteNode.children[index];
}
