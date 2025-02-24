import { LinkingContext, useNavigationBuilder, } from '@react-navigation/native';
import { Children, Fragment, isValidElement, useContext, useMemo, } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabTriggerMapContext, } from './TabContext';
import { isTabList } from './TabList';
import { ExpoTabRouter } from './TabRouter';
import { isTabSlot } from './TabSlot';
import { isTabTrigger } from './TabTrigger';
import { SafeAreaViewSlot, triggersToScreens } from './common';
import { useComponent } from './useComponent';
import { useRouteNode, useContextKey } from '../Route';
import { useRouteInfo } from '../hooks';
import { resolveHref } from '../link/href';
import { shouldLinkExternally } from '../utils/url';
import { NavigatorContext } from '../views/Navigator';
export * from './TabContext';
export * from './TabList';
export * from './TabSlot';
export * from './TabTrigger';
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
export function Tabs(props) {
    const { children, asChild, options, ...rest } = props;
    const Comp = asChild ? SafeAreaViewSlot : View;
    const { NavigationContent } = useTabsWithChildren({
        // asChild adds an extra layer, so we need to process the child's children
        children: asChild && isValidElement(children) ? children.props.children : children,
        ...options,
    });
    return (<Comp style={styles.tabsRoot} {...rest}>
      <NavigationContent>{children}</NavigationContent>
    </Comp>);
}
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
export function useTabsWithChildren(options) {
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
export function useTabsWithTriggers(options) {
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
    const { children, triggerMap } = triggersToScreens(triggers, routeNode, linking, initialRouteName, parentTriggerMap, routeInfo, contextKey);
    const navigatorContext = useNavigationBuilder(ExpoTabRouter, {
        children,
        ...rest,
        triggerMap,
        id: contextKey,
        initialRouteName,
    });
    const { state, descriptors, navigation, describe, NavigationContent: RNNavigationContent, } = navigatorContext;
    const navigatorContextValue = useMemo(() => ({
        ...navigatorContext,
        contextKey,
        router: ExpoTabRouter,
    }), [navigatorContext, contextKey, ExpoTabRouter]);
    const NavigationContent = useComponent((children) => (<TabTriggerMapContext.Provider value={triggerMap}>
      <NavigatorContext.Provider value={navigatorContextValue}>
        <RNNavigationContent>{children}</RNNavigationContent>
      </NavigatorContext.Provider>
    </TabTriggerMapContext.Provider>));
    return { state, descriptors, navigation, NavigationContent, describe };
}
function parseTriggersFromChildren(children, screenTriggers = [], isInTabList = false) {
    Children.forEach(children, (child) => {
        if (!child || !isValidElement(child) || isTabSlot(child)) {
            return;
        }
        if (isFragment(child) && typeof child.props.children !== 'function') {
            return parseTriggersFromChildren(child.props.children, screenTriggers, isInTabList || isTabList(child));
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
                console.warn(`<TabTrigger name={${name}}> does not have a 'href' prop. TabTriggers within a <TabList /> are required to have an href.`);
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
                console.warn(`<TabTrigger> does not have a 'name' prop. TabTriggers within a <TabList /> are required to have a name.`);
            }
            return;
        }
        return screenTriggers.push({ type: 'internal', href: resolvedHref, name });
    });
    return screenTriggers;
}
function isFragment(child) {
    return child.type === Fragment;
}
const styles = StyleSheet.create({
    tabsRoot: {
        flex: 1,
    },
});
//# sourceMappingURL=Tabs.js.map