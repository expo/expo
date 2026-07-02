import type { ComponentProps, ReactElement, ReactNode, PropsWithChildren } from 'react';
import { Children, Fragment, isValidElement, use, useMemo } from 'react';
import type { ViewProps } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useRouteNode, useContextKey } from '../Route';
import { useRouteInfo } from '../hooks';
import { resolveHref } from '../link/href';
import { NavigatorTypeContext } from '../react-navigation/core/NavigatorTypeContext';
import type {
  DefaultNavigatorOptions,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
} from '../react-navigation/native';
import { LinkingContext, useNavigationBuilder } from '../react-navigation/native';
import { usePreloadRoutes } from '../react-navigation/usePreloadRoutes';
import { useTabPlaceholders } from '../react-navigation/useTabPlaceholders';
import { shouldLinkExternally } from '../utils/url';
import type { NavigatorContextValue } from '../views/Navigator';
import { NavigatorContext } from '../views/Navigator';
import type { ExpoTabsScreenOptions, TabNavigationEventMap, TabsContextValue } from './TabContext';
import { TabTriggerMapContext } from './TabContext';
import { isTabList } from './TabList';
import type { ExpoTabRouterOptions } from './TabRouter';
import { ExpoTabRouter } from './TabRouter';
import { isTabSlot } from './TabSlot';
import { isTabTrigger } from './TabTrigger';
import type { ScreenTrigger } from './common';
import { ViewSlot, triggersToScreens } from './common';
import { useComponent } from './useComponent';

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
  const routeNode = useRouteNode();
  const contextKey = useContextKey();
  const linking = use(LinkingContext).options;
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

  // Headless tabs follow the bottom-tabs policy: show every declared tab from the first frame via
  // placeholders. Tabs default to `lazy`, so only routes that opt out with `lazy={false}` preload.
  const [tabState, tabDescriptors] = useTabPlaceholders(
    state,
    descriptors,
    describe,
    contextKey,
    state.routeNames
  );
  const nonLazyRouteNames = useMemo(
    () =>
      state.routeNames.filter((name) => {
        const placeholder = tabState.routes.find((route) => route.name === name);
        return placeholder ? tabDescriptors[placeholder.key]?.options.lazy === false : false;
      }),
    [state.routeNames, tabState.routes, tabDescriptors]
  );
  usePreloadRoutes(state, navigation, nonLazyRouteNames);

  const navigatorContextValue = useMemo<NavigatorContextValue>(
    () =>
      ({
        ...(navigatorContext as unknown as ReturnType<typeof useNavigationBuilder>),
        // Expose the placeholder-augmented state/descriptors so consumers (TabSlot, TabTrigger) see
        // every declared tab from the first frame, matching the cast used for the spread above.
        state: tabState,
        descriptors: tabDescriptors,
        contextKey,
        router: ExpoTabRouter,
      }) as unknown as NavigatorContextValue,
    [navigatorContext, tabState, tabDescriptors, contextKey, ExpoTabRouter]
  );

  const NavigationContent = useComponent((children: React.ReactNode) => (
    <NavigatorTypeContext value="tab">
      <TabTriggerMapContext.Provider value={triggerMap}>
        <NavigatorContext.Provider value={navigatorContextValue}>
          <RNNavigationContent>{children}</RNNavigationContent>
        </NavigatorContext.Provider>
      </TabTriggerMapContext.Provider>
    </NavigatorTypeContext>
  )) as TabsContextValue['NavigationContent'];

  return {
    state: tabState,
    descriptors: tabDescriptors,
    navigation,
    NavigationContent,
    describe,
  };
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
