import {
  LinkingContext,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  useNavigationBuilder,
} from '@react-navigation/native';
import {
  Children,
  ComponentProps,
  Fragment,
  ReactElement,
  ReactNode,
  isValidElement,
  useContext,
} from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';

import {
  ExpoTabsProps,
  ExpoTabsScreenOptions,
  TabNavigationEventMap,
  TabTriggerMapContext,
  TabsDescriptorsContext,
  TabsNavigatorContext,
  TabsStateContext,
} from './TabContext';
import { isTabList } from './TabList';
import { ExpoTabRouter, ExpoTabRouterOptions } from './TabRouter';
import { isTabSlot } from './TabSlot';
import { isTabTrigger } from './TabTrigger';
import { SafeAreaViewSlot, ScreenTrigger, triggersToScreens } from './common';
import { useComponent } from './useComponent';
import { useRouteNode, useContextKey } from '../Route';
import { useRouteInfo } from '../hooks';
import { resolveHref } from '../link/href';
import { shouldLinkExternally } from '../utils/url';

export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';

export type UseTabsOptions = Omit<ExpoTabsProps, 'children'> &
  Omit<ExpoTabRouterOptions, 'initialRouteName' | 'triggerMap'>;

export type TabsProps = ViewProps & {
  asChild?: boolean;
  options?: UseTabsOptions;
};

export function Tabs({ children, asChild, options, ...props }: TabsProps) {
  const Comp = asChild ? SafeAreaViewSlot : View;

  const { NavigationContent } = useTabsWithChildren({
    // asChild adds an extra layer, so we need to process the child's children
    children: asChild && isValidElement(children) ? children.props.children : children,
    ...options,
  });

  return (
    <Comp style={styles.tabsRoot} {...props}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>
  );
}

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
  // Ensure we extend the parent triggers, so we can trigger them as well
  const parentTriggerMap = useContext(TabTriggerMapContext);
  const routeNode = useRouteNode();
  const contextKey = useContextKey();
  const linking = useContext(LinkingContext).options;
  const routeInfo = useRouteInfo();

  if (!routeNode || !linking) {
    throw new Error('No RouteNode. This is likely a bug in expo-router.');
  }

  const initialRouteName = routeNode.initialRouteName;

  const { children, triggerMap } = triggersToScreens(
    triggers,
    routeNode,
    linking,
    initialRouteName,
    parentTriggerMap,
    routeInfo,
    contextKey
  );

  const {
    state,
    descriptors,
    navigation,
    NavigationContent: RNNavigationContent,
  } = useNavigationBuilder<
    TabNavigationState<any>,
    ExpoTabRouterOptions,
    TabActionHelpers<ParamListBase>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >(ExpoTabRouter, {
    children,
    ...options,
    triggerMap,
    id: contextKey,
    initialRouteName,
  });

  const NavigationContent = useComponent((children: React.ReactNode) => (
    <TabTriggerMapContext.Provider value={triggerMap}>
      <TabsNavigatorContext.Provider value={navigation}>
        <TabsDescriptorsContext.Provider value={descriptors}>
          <TabsStateContext.Provider value={state}>
            <RNNavigationContent>{children}</RNNavigationContent>
          </TabsStateContext.Provider>
        </TabsDescriptorsContext.Provider>
      </TabsNavigatorContext.Provider>
    </TabTriggerMapContext.Provider>
  ));

  return { state, descriptors, navigation, NavigationContent };
}

function parseTriggersFromChildren(
  children: ReactNode,
  screenTriggers: ScreenTrigger<any>[] = [],
  isInTabList = false
) {
  Children.forEach(children, (child) => {
    if (!child || !isValidElement(child) || isTabSlot(child)) {
      return;
    }

    if (isFragment(child) && typeof child.props.children !== 'function') {
      return parseTriggersFromChildren(
        child.props.children,
        screenTriggers,
        isInTabList || isTabList(child)
      );
    }

    if (isTabList(child) && typeof child.props.children !== 'function') {
      let children = child.props.children;

      // <TabList asChild /> adds an extra layer. We need to parse the child's children
      if (child.props.asChild && isValidElement(children)) {
        children = children.props.children;
      }

      return parseTriggersFromChildren(children, screenTriggers, isInTabList || isTabList(child));
    }

    // We should only process TabTriggers within the TabList. All other components will be ignored
    if (!isInTabList || !isTabTrigger(child)) {
      return;
    }

    const { href, name } = child.props;

    if (!href) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have a href.`
        );
      }
      return;
    }

    const resolvedHref = resolveHref(href);

    if (shouldLinkExternally(resolvedHref)) {
      return screenTriggers.push({
        type: 'external',
        name,
        href: resolvedHref,
      });
    }

    if (!name) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `<TabTrigger> does not have a 'name' prop. TabTriggers within a <TabList /> are required to have a name.`
        );
      }
      return;
    }

    return screenTriggers.push({ type: 'internal', href: resolvedHref, name });
  });

  return screenTriggers;
}

function isFragment(
  child: ReactElement<any>
): child is ReactElement<ComponentProps<typeof Fragment>> {
  return child.type === Fragment;
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
});
