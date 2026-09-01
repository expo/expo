import type { ComponentProps, ReactElement, ReactNode, PropsWithChildren } from 'react';
import { Children, Fragment, isValidElement, use, useMemo } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { getValidInitialRouteName, useRouteNode, useContextKey } from '../Route';
import { useComponent } from '../fork/useComponent';
import { useRouteInfo } from '../hooks';
import { GuardContextProvider, type GuardedRedirects } from '../layouts/GuardContext';
import { resolveHref } from '../link/href';
import type {
  DefaultNavigatorOptions,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
import { LinkingContext, useNavigationBuilder } from '../react-navigation/native';
import {
  appendMissingPlaceholderTabDescriptors,
  appendMissingPlaceholderTabRoutes,
} from '../standard-navigation/appendMissingPlaceholderTabRoutes';
import type { PlaceholderDescriptorMap } from '../standard-navigation/types';
import { useVisibleTabsWithRedirect } from '../standard-navigation/useVisibleTabsWithRedirect';
import { shouldLinkExternally } from '../utils/url';
import type { NavigatorContextValue } from '../views/Navigator';
import { NavigatorContext } from '../views/Navigator';
import type { ExpoTabsScreenOptions, TabNavigationEventMap, TabsContextValue } from './TabContext';
import { TabNavigatorStatesContext, TabTriggerMapContext } from './TabContext';
import { isTabList } from './TabList';
import type { ExpoTabRouterOptions } from './TabRouter';
import { ExpoTabRouter } from './TabRouter';
import { isTabSlot } from './TabSlot';
import { isTabTrigger } from './TabTrigger';
import type { ScreenTrigger } from './common';
import { ViewSlot, useTriggersToScreens } from './common';

export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';

const emptyGuardedRedirects: GuardedRedirects = new Map();

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
  'children' | 'initialRouteName'
> & {
  backBehavior?: TabRouterOptions['backBehavior'];
};

export type TabsProps = ViewProps & {
  /** Forward props to child component and removes the extra `<View>`. Useful for custom wrappers. */
  asChild?: boolean;
  options?: UseTabsOptions;
};

/**
 * Root component for the headless tabs.
 *
 * @see [`useTabsWithChildren`](#usetabswithchildrenoptions) for a hook version of this component.
 * @example
 * ```tsx
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
  const Comp = asChild ? ViewSlot : View;

  const { NavigationContent } = useTabsWithChildren({
    // asChild adds an extra layer, so we need to process the child's children
    children:
      asChild &&
      isValidElement(children) &&
      children.props &&
      typeof children.props === 'object' &&
      'children' in children.props
        ? (children.props.children as ReactNode)
        : children,
    ...options,
  });

  return (
    <Comp style={styles.tabsRoot} {...rest}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>
  );
}

// @docsMissing
export type UseTabsWithChildrenOptions = PropsWithChildren<UseTabsOptions>;

// @docsMissing
export type UseTabsWithTriggersOptions = UseTabsOptions & {
  triggers: ScreenTrigger[];
};

/**
 * Hook version of `Tabs`. The returned NavigationContent component
 * should be rendered. Using the hook requires using the `<TabList />`
 * and `<TabTrigger />` components exported from Expo Router.
 *
 * The `useTabsWithTriggers()` hook can be used for custom components.
 *
 * @see [`Tabs`](#tabs) for the component version of this hook.
 * @example
 * ```tsx
 * export function MyTabs({ children }) {
 *  const { NavigationContent } = useTabsWithChildren({ children })
 *
 *  return <NavigationContent />
 * }
 * ```
 */
export function useTabsWithChildren(options: UseTabsWithChildrenOptions) {
  const { children, ...rest } = options;
  return useTabsWithTriggers({ triggers: parseTriggersFromChildren(children), ...rest });
}

/**
 * Alternative hook version of `Tabs` that uses explicit triggers
 * instead of `children`.
 *
 * @see [`Tabs`](#tabs) for the component version of this hook.
 * @example
 * ```tsx
 * export function MyTabs({ children }) {
 *   const { NavigationContent } = useTabsWithChildren({ triggers: [] })
 *
 *   return <NavigationContent />
 * }
 * ```
 */
export function useTabsWithTriggers(options: UseTabsWithTriggersOptions): TabsContextValue {
  const { triggers, ...rest } = options;
  // Ensure we extend the parent triggers, so we can trigger them as well
  const parentTriggerMap = use(TabTriggerMapContext);
  const parentNavigatorStates = use(TabNavigatorStatesContext);
  const routeNode = useRouteNode();
  const contextKey = useContextKey();
  const linking = use(LinkingContext).options;
  const routeInfo = useRouteInfo();

  if (!routeNode || !linking) {
    throw new Error('No RouteNode. This is likely a bug in expo-router.');
  }

  const initialRouteName = getValidInitialRouteName(routeNode);

  const { children, triggerMap } = useTriggersToScreens(
    triggers,
    routeNode,
    linking,
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
    backBehavior: rest.backBehavior ?? (initialRouteName ? 'initialRoute' : undefined),
  });

  const {
    state,
    describe,
    descriptors: sparseDescriptors,
    navigation,
    NavigationContent: RNNavigationContent,
  } = navigatorContext;
  const descriptors = useMemo(
    () =>
      appendMissingPlaceholderTabDescriptors(
        sparseDescriptors,
        state,
        describe
      ) as typeof sparseDescriptors,
    [describe, sparseDescriptors, state]
  );
  const navigatorStates = useMemo(
    () => ({ ...parentNavigatorStates, [contextKey]: state }),
    [contextKey, parentNavigatorStates, state]
  );

  const navigatorContextValue = useMemo<NavigatorContextValue>(
    () => ({
      ...(navigatorContext as unknown as NavigatorContextValue),
      descriptors: descriptors as unknown as NavigatorContextValue['descriptors'],
      contextKey,
      router: ExpoTabRouter,
    }),
    [navigatorContext, descriptors, contextKey, ExpoTabRouter]
  );

  const NavigationContent = useComponent((children: React.ReactNode) => (
    // Headless tabs have no guards, so shadow parent guards whose route names may collide.
    <GuardContextProvider node={routeNode} guardedRedirects={emptyGuardedRedirects}>
      <TabVisibilityRedirect state={state} descriptors={descriptors} />
      <TabTriggerMapContext.Provider value={triggerMap}>
        <TabNavigatorStatesContext.Provider value={navigatorStates}>
          <NavigatorContext.Provider value={navigatorContextValue}>
            <RNNavigationContent>{children}</RNNavigationContent>
          </NavigatorContext.Provider>
        </TabNavigatorStatesContext.Provider>
      </TabTriggerMapContext.Provider>
    </GuardContextProvider>
  )) as TabsContextValue['NavigationContent'];

  return { state, describe, descriptors, navigation, NavigationContent };
}

function TabVisibilityRedirect({
  state,
  descriptors,
}: {
  state: TabNavigationState<any>;
  descriptors: PlaceholderDescriptorMap;
}) {
  const stateWithPlaceholders = useMemo(
    () => appendMissingPlaceholderTabRoutes(state, descriptors),
    [descriptors, state]
  );
  useVisibleTabsWithRedirect({
    routes: stateWithPlaceholders.routes,
    routeNames: stateWithPlaceholders.routeNames,
    focusedRouteKey: stateWithPlaceholders.routes[stateWithPlaceholders.index]?.key,
    descriptors,
  });
  return null;
}

function parseTriggersFromChildren(
  children: ReactNode,
  screenTriggers: ScreenTrigger[] = [],
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
      if (
        child.props.asChild &&
        isValidElement(children) &&
        children.props &&
        typeof children.props === 'object' &&
        'children' in children.props
      ) {
        children = children.props.children as ReactNode;
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
          `<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have an href.`
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
