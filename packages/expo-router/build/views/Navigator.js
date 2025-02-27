// Copyright © 2024 650 Industries.
'use client';
import { StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from './Screen';
import { useContextKey } from '../Route';
import { useFilterScreenChildren } from '../layouts/withLayoutContext';
import { useSortedScreens } from '../useScreens';
export const NavigatorContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    NavigatorContext.displayName = 'NavigatorContext';
}
/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
export function Navigator({ initialRouteName, screenOptions, children, router, routerOptions, }) {
    const contextKey = useContextKey();
    // A custom navigator can have a mix of Screen and other components (like a Slot inside a View)
    const { screens, children: nonScreenChildren } = useFilterScreenChildren(children, {
        isCustomNavigator: true,
        contextKey,
    });
    const sortedScreens = useSortedScreens(screens ?? []);
    router ||= StackRouter;
    const navigation = useNavigationBuilder(router, {
        // Used for getting the parent with navigation.getParent('/normalized/path')
        ...routerOptions,
        id: contextKey,
        children: sortedScreens || [<Screen key="default"/>],
        screenOptions,
        initialRouteName,
    });
    // useNavigationBuilder requires at least one screen to be defined otherwise it will throw.
    if (!sortedScreens.length) {
        console.warn(`Navigator at "${contextKey}" has no children.`);
        return null;
    }
    return (<NavigatorContext.Provider value={{
            ...navigation,
            contextKey,
            router,
        }}>
      {nonScreenChildren}
    </NavigatorContext.Provider>);
}
/**
 * @hidden
 */
export function useNavigatorContext() {
    const context = React.useContext(NavigatorContext);
    if (!context) {
        throw new Error('useNavigatorContext must be used within a <Navigator />');
    }
    return context;
}
function SlotNavigator(props) {
    const contextKey = useContextKey();
    // Allows adding Screen components as children to configure routes.
    const { screens } = useFilterScreenChildren([], {
        contextKey,
    });
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, {
        ...props,
        id: contextKey,
        children: useSortedScreens(screens ?? []),
    });
    return (<NavigationContent>{descriptors[state.routes[state.index].key].render()}</NavigationContent>);
}
/**
 * Renders the currently selected content.
 *
 * There are actually two different implementations of `<Slot/>`:
 *  - Used inside a `_layout` as the `Navigator`
 *  - Used inside a `Navigator` as the content
 *
 * Since a custom `Navigator` will set the `NavigatorContext.contextKey` to
 * the current `_layout`, you can use this to determine if you are inside
 * a custom navigator or not.
 */
export function Slot(props) {
    const contextKey = useContextKey();
    const context = React.useContext(NavigatorContext);
    if (context?.contextKey !== contextKey) {
        // The _layout has changed since the last navigator
        return <SlotNavigator {...props}/>;
    }
    /*
     * The user has defined a custom navigator
     * <Navigator><Slot /></Navigator>
     */
    return <NavigatorSlot />;
}
/**
 * Render the current navigator content.
 */
function NavigatorSlot() {
    const context = useNavigatorContext();
    const { state, descriptors } = context;
    return descriptors[state.routes[state.index].key]?.render() ?? null;
}
/**
 * The default navigator for the app when no root _layout is provided.
 */
export function DefaultNavigator() {
    return (<SafeAreaView style={{ flex: 1 }}>
      <SlotNavigator />
    </SafeAreaView>);
}
Navigator.Slot = NavigatorSlot;
Navigator.useContext = useNavigatorContext;
/** Used to configure route settings. */
Navigator.Screen = Screen;
//# sourceMappingURL=Navigator.js.map