import {
  Fragment,
  FunctionComponentElement,
  isValidElement,
  useId,
  useContext,
  Children,
  ReactNode,
} from 'react';
import { Platform, StyleSheet, ViewProps, View } from 'react-native';
import { createNavigatorFactory } from '@react-navigation/core';
import {
  DefaultNavigatorOptions,
  LinkingContext,
  LinkingOptions,
  ParamListBase,
  TabActionHelpers,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { TabsContext, ExpoTabsScreenOptions } from './Tabs.common';
import { RouteNode, useRouteNode } from '../Route';
import { getQualifiedRouteComponent } from '../useScreens';
import { resolveHref } from '../link/href';
import { Href } from '../types';
import { shouldLinkExternally } from '../utils/url';
import { ExpoTabNavigationState, ExpoTabRouterOptions, TabRouter } from './Tabs.router';
import { sortRoutesWithInitial } from '../sortRoutes';
import { TabList, TabTrigger, TabTriggerOptions, TabTriggerProps } from './Tabs.bar';

export * from './Tabs.slot';
export * from './Tabs.bar';
export * from './Tabs.common';

export type UseTabsOptions = Omit<
  DefaultNavigatorOptions<
    ParamListBase,
    ExpoTabNavigationState,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >,
  'children'
> &
  Omit<TabRouterOptions, 'initialRouteName'> & {
    triggers: TabTriggerOptions[];
  };

// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = createNavigatorFactory({} as any)();

export type TabsProps = ViewProps;

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

export function useTabs({ triggers, ...options }: UseTabsOptions) {
  const routeNode = useRouteNode();
  const linking = useContext(LinkingContext).options;

  if (!routeNode || !linking) {
    throw new Error('No RouteNode. This is likely a bug in expo-router.');
  }

  const { children, initialRouteName } = triggersToScreens(triggers, routeNode, linking);

  const key = `${routeNode.contextKey}-${useId()}`;

  const { state, descriptors, navigation, ...rest } = useNavigationBuilder<
    ExpoTabNavigationState,
    ExpoTabRouterOptions,
    TabActionHelpers<ParamListBase>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >(TabRouter, {
    children,
    backBehavior: Platform.OS === 'web' ? 'history' : 'firstRoute',
    ...options,
    initialRouteName,
    key,
  });

  const routes = Object.fromEntries(
    state.routes.map((route, index) => {
      const options = descriptors[route.key].options;
      const action = {
        ...options.action,
        target: state.key,
      };

      return [
        '/',
        {
          route,
          action,
          key: route.key,
          isFocused: state.index === index,
          props: {
            key: route.key,
            onPress: () => {
              const isFocused = state.index === index;
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.dispatch(action);
              }
            },
          },
        },
      ];
    })
  );

  return { state, descriptors, navigation, routes, ...rest };
}

export type ExpoTabHrefs =
  | Record<string, Omit<ExpoTabsScreenOptions, 'action'>>
  | Array<Href | [Href, Omit<ExpoTabsScreenOptions, 'action'>]>;

type ScreenConfig = {
  routeNode: RouteNode;
  key: string;
};

function isTabListOrFragment(child: ReactNode): child is FunctionComponentElement<TabTriggerProps> {
  return isValidElement(child) && (child.type === TabList || child.type === Fragment);
}

function isTabTrigger(child: ReactNode): child is FunctionComponentElement<TabTriggerProps> {
  return isValidElement(child) && child.type === TabTrigger;
}

function parseTriggersFromChildren(children: ReactNode, screenTriggers: TabTriggerOptions[] = []) {
  Children.forEach(children, (child) => {
    if (isTabListOrFragment(child)) {
      return parseTriggersFromChildren(child.props.children, screenTriggers);
    }

    if (!isTabTrigger(child)) {
      return;
    }

    let { href, initialRoute } = child.props;

    href = resolveHref(href);

    if (shouldLinkExternally(href)) {
      return;
    }

    screenTriggers.push({ href, initialRoute });
    return;
  });

  return screenTriggers;
}

function triggersToScreens(
  triggers: TabTriggerOptions[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>
) {
  let initialRouteName: string | undefined;

  const screenConfig = triggers.reduce((acc, { href, initialRoute }, index) => {
    let state = linking.getStateFromPath?.(href as any, linking.config)?.routes[0];

    if (!state) {
      return acc;
    }

    if (layoutRouteNode.route) {
      while (state?.state) {
        const previousState = state;
        state = state.state.routes[0];
        if (previousState.name === layoutRouteNode.route) break;
      }
    }

    let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);

    if (routeNode) {
      const key = `${routeNode.route}#${index}`;
      if (initialRoute) {
        initialRouteName = routeNode.route;
      }

      acc.push({ routeNode, key });
    }

    return acc;
  }, [] as ScreenConfig[]);

  const sortFn = sortRoutesWithInitial(initialRouteName);

  const children = screenConfig
    .sort((a, b) => sortFn(a.routeNode, b.routeNode))
    .map(({ routeNode, key }) => (
      <Screen key={key} name={key} getComponent={() => getQualifiedRouteComponent(routeNode)} />
    ));

  return {
    children,
    initialRouteName,
  };
}

export function Tabs({ children, ...props }: TabsProps) {
  const tabs = useTabs({ triggers: parseTriggersFromChildren(children) });
  const NavigationContent = tabs.NavigationContent;

  return (
    <TabsContext.Provider value={tabs}>
      <View style={styles.tabsRoot} {...props}>
        <NavigationContent>{children}</NavigationContent>
      </View>
    </TabsContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
