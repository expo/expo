import {
  DefaultNavigatorOptions,
  LinkingContext,
  ParamListBase,
  TabActionHelpers,
  useNavigationBuilder,
  TabNavigationState,
} from '@react-navigation/native';
import {
  Fragment,
  FunctionComponentElement,
  isValidElement,
  useContext,
  Children,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';

import {
  ExpoTabsScreenOptions,
  TabNavigationEventMap,
  TabsDescriptorsContext,
  TabsStateContext,
} from './Tabs.common';
import { TabList, TabListProps, TabTrigger, TabTriggerProps } from './Tabs.list';
import { TabSlot } from './Tabs.slot';
import { TabRouter, TabRouterOptions } from './TabsRouter';
import { ScreenTrigger, triggersToScreens } from './common';
import { useComponent } from './useComponent';
import { useContextKey, useRouteNode } from '../Route';
import { resolveHref } from '../link/href';
import { Href } from '../types';
import { shouldLinkExternally } from '../utils/url';

export type UseTabsOptions = Omit<
  DefaultNavigatorOptions<
    ParamListBase,
    TabNavigationState<any>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >,
  'children'
> &
  Omit<TabRouterOptions, 'initialRouteName' | 'triggerMap'>;

export type UseTabsWithChildrenOptions = UseTabsOptions & {
  children: ReactNode;
};

export type UseTabsWithTriggersOptions<T extends string | object> = UseTabsOptions & {
  triggers: ScreenTrigger<T>[];
};

export function useTabsWithChildren({ children, ...options }: UseTabsWithChildrenOptions) {
  return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...options });
}

export function useTabsWithTriggers<T extends string | object>({
  triggers,
  ...options
}: UseTabsWithTriggersOptions<T>) {
  const routeNode = useRouteNode();
  const contextKey = useContextKey();
  const linking = useContext(LinkingContext).options;

  if (!routeNode || !linking) {
    throw new Error('No RouteNode. This is likely a bug in expo-router.');
  }

  const initialRouteName = routeNode.initialRouteName;
  const { children, triggerMap } = triggersToScreens(
    triggers,
    routeNode,
    linking,
    initialRouteName
  );

  const {
    state,
    descriptors,
    navigation,
    NavigationContent: RNNavigationContent,
  } = useNavigationBuilder<
    TabNavigationState<any>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >(TabRouter, {
    children,
    backBehavior: Platform.OS === 'web' ? 'history' : 'firstRoute',
    ...options,
    triggerMap,
    id: contextKey,
    initialRouteName,
  });

  const routes = Object.fromEntries(
    state.routes.map((route, index) => {
      const options = descriptors[route.key].options;
      const action = {
        ...options.action,
        target: state.key,
      };

      return [
        route.name,
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

  console.log(JSON.stringify(state, null, 2));

  const NavigationContent = useComponent((children: React.ReactNode) => (
    <TabsDescriptorsContext.Provider value={descriptors}>
      <TabsStateContext.Provider value={state}>
        <RNNavigationContent>{children}</RNNavigationContent>
      </TabsStateContext.Provider>
    </TabsDescriptorsContext.Provider>
  ));

  return { state, descriptors, navigation, routes, NavigationContent };
}

export type ExpoTabHrefs =
  | Record<string, Omit<ExpoTabsScreenOptions, 'action'>>
  | (Href | [Href, Omit<ExpoTabsScreenOptions, 'action'>])[];

function isTabListOrFragment(
  child: ReactNode
): child is FunctionComponentElement<TabTriggerProps<any>> {
  return isValidElement(child) && (child.type === TabList || child.type === Fragment);
}

function isTabTrigger(child: ReactNode): child is FunctionComponentElement<TabTriggerProps<any>> {
  return isValidElement(child) && child.type === TabTrigger;
}

function isTabSlot(child: ReactNode): child is FunctionComponentElement<TabListProps> {
  return isValidElement(child) && child.type === TabSlot;
}

function parseTriggersFromChildren(children: ReactNode, screenTriggers: ScreenTrigger<any>[] = []) {
  Children.forEach(children, (child) => {
    if (isTabListOrFragment(child) && typeof child.props.children !== 'function') {
      return parseTriggersFromChildren(child.props.children, screenTriggers);
    }

    if (!child || isTabSlot(child)) {
      return;
    }

    if (!isTabTrigger(child)) {
      if (!isValidElement(child)) {
        console.warn(
          `<Tabs /> only accepts <TabSlot /> and <TabTrigger /> as children. Found unknown component`
        );
      } else {
        console.warn(
          `<Tabs /> only accepts <TabSlot /> and <TabTrigger /> as children. Found component ${typeof child.type === 'string' ? child.type : child.type.name}`
        );
      }

      return;
    }

    const { href, name } = child.props;

    if (shouldLinkExternally(resolveHref(href))) {
      return;
    }

    if (!href) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have a href.`
        );
      }
      return;
    }

    if (!name) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `<TabTrigger> does not have a 'name' prop. TabTriggers within a <TabList /> are required to have a name.`
        );
      }
      return;
    }

    return screenTriggers.push({ href, name });
  });

  return screenTriggers;
}
