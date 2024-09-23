import {
  DefaultNavigatorOptions,
  LinkingContext,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
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
  useMemo,
} from 'react';
import { StyleSheet, ViewProps, View } from 'react-native';

import {
  ExpoTabsScreenOptions,
  TabNavigationEventMap,
  TabTriggerMapContext,
  TabsContextValue,
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
import { NavigatorContext, NavigatorContextValue } from '../views/Navigator';

export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';

/**
 * Options to provide to the Tab Router.
 */
export type UseTabsOptions = Omit<
  DefaultNavigatorOptions<
    ParamListBase,
    any,
    TabNavigationState<any>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap,
    any
  >,
  'children'
> & {
  backBehavior?: TabRouterOptions['backBehavior'];
};

export type TabsProps = ViewProps & {
  /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
  asChild?: boolean;
  options?: UseTabsOptions;
};

/**
 * Root component for the headless tabs.
 *
 * @see useTabsWithChildren - The hook version of this component.
 * @example
 * ```ts
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export function Tabs(props: TabsProps) {
  const { children, asChild, options, ...rest } = props;
  const Comp = asChild ? SafeAreaViewSlot : View;

  const { NavigationContent } = useTabsWithChildren({
    // asChild adds an extra layer, so we need to process the child's children
    children: asChild && isValidElement(children) ? children.props.children : children,
    ...options,
  });

  return (
    <Comp style={styles.tabsRoot} {...rest}>
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

/**
 * Hook version of `<Tabs />`. The returned NavigationContent component should be rendered
 *
 * @see Tabs - The component version of this hook
 * @example
 * ```ts
 * export function MyTabs({ children }) {
 *   const { NavigationContent } = useTabsWithChildren({ children })
 * return <NavigationContent />
 * ```
 */
export function useTabsWithChildren(options: UseTabsWithChildrenOptions) {
  const { children, ...rest } = options;
  return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...rest });
}

/**
 * Alternative hook version of `<Tabs />` that uses explicit triggers instead of `children`
 *
 * @see Tabs - The component version of this hook
 * @example
 * ```ts
 * export function MyTabs({ children }) {
 *   const { NavigationContent } = useTabsWithChildren({ triggers: [] })
 *   return <NavigationContent />
 * }
 * ```
 */
export function useTabsWithTriggers<T extends string | object>(
  options: UseTabsWithTriggersOptions<T>
): TabsContextValue {
  const { triggers, ...rest } = options;
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

  const navigatorContext = useNavigationBuilder<
    TabNavigationState<any>,
    ExpoTabRouterOptions,
    TabActionHelpers<ParamListBase>,
    ExpoTabsScreenOptions,
    TabNavigationEventMap
  >(ExpoTabRouter, {
    children,
    ...rest,
    triggerMap,
    id: contextKey,
    initialRouteName,
  });

  const {
    state,
    descriptors,
    navigation,
    describe,
    NavigationContent: RNNavigationContent,
  } = navigatorContext;

  const navigatorContextValue = useMemo<NavigatorContextValue>(
    () => ({
      ...(navigatorContext as unknown as ReturnType<typeof useNavigationBuilder>),
      contextKey,
      router: ExpoTabRouter,
    }),
    [navigatorContext, contextKey, ExpoTabRouter]
  );

  const NavigationContent = useComponent((children: React.ReactNode) => (
    <TabTriggerMapContext.Provider value={triggerMap}>
      <NavigatorContext.Provider value={navigatorContextValue}>
        <RNNavigationContent>{children}</RNNavigationContent>
      </NavigatorContext.Provider>
    </TabTriggerMapContext.Provider>
  )) as TabsContextValue['NavigationContent'];

  return { state, descriptors, navigation, NavigationContent, describe };
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
