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
  DefaultNavigatorOptions,
  LinkingContext,
  ParamListBase,
  TabActionHelpers,
  TabRouterOptions,
  TabRouter,
  useNavigationBuilder,
  TabNavigationState,
} from '@react-navigation/native';
import {
  ExpoTabsScreenOptions,
  TabNavigationEventMap,
  TabsDescriptorsContext,
  TabsStateContext,
} from './Tabs.common';
import { useContextKey, useRouteNode } from '../Route';
import { resolveHref } from '../link/href';
import { Href } from '../types';
import { shouldLinkExternally } from '../utils/url';
import { TabList, TabListProps, TabTrigger, TabTriggerOptions, TabTriggerProps } from './Tabs.list';
import { TabSlot } from './Tabs.slot';
import { triggersToScreens } from './common';

export type UseTabsOptions = Omit<
  DefaultNavigatorOptions<
    ParamListBase,
    TabNavigationState<any>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >,
  'children'
> &
  Omit<TabRouterOptions, 'initialRouteName'>;

export type UseTabsWithChildrenOptions = UseTabsOptions & {
  children: ReactNode;
};

export type UseTabsWithTriggersOptions<T extends string | object> = UseTabsOptions & {
  triggers: TabTriggerOptions<T>[];
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
  const { children } = triggersToScreens(triggers, routeNode, linking, initialRouteName);

  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<any>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >(TabRouter, {
    children,
    backBehavior: Platform.OS === 'web' ? 'history' : 'firstRoute',
    ...options,
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

  const navigationContent = (props) => {
    return (
      <TabsDescriptorsContext.Provider value={descriptors}>
        <TabsStateContext.Provider value={state}>
          <NavigationContent {...props} />
        </TabsStateContext.Provider>
      </TabsDescriptorsContext.Provider>
    );
  };

  return { state, descriptors, navigation, routes, NavigationContent: navigationContent };
}

export type ExpoTabHrefs =
  | Record<string, Omit<ExpoTabsScreenOptions, 'action'>>
  | Array<Href | [Href, Omit<ExpoTabsScreenOptions, 'action'>]>;

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

function parseTriggersFromChildren(
  children: ReactNode,
  screenTriggers: TabTriggerOptions<any>[] = []
) {
  Children.forEach(children, (child) => {
    if (isTabListOrFragment(child)) {
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

    let { href } = child.props;

    href = resolveHref(href);

    if (shouldLinkExternally(href)) {
      return;
    }

    screenTriggers.push({ href });
    return;
  });

  return screenTriggers;
}
