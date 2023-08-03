import { StackRouter, useNavigationBuilder } from '@react-navigation/native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContextKey } from '../Route';
import { useFilterScreenChildren } from '../layouts/withLayoutContext';
import { useSortedScreens } from '../useScreens';
import { Screen } from './Screen';
// TODO: This might already exist upstream, maybe something like `useCurrentRender` ?
export const NavigatorContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    NavigatorContext.displayName = 'NavigatorContext';
}
/** An unstyled custom navigator. Good for basic web layouts */
export function Navigator({ initialRouteName, screenOptions, children, router }) {
    const contextKey = useContextKey();
    // Allows adding Screen components as children to configure routes.
    const { screens, children: otherSlot } = useFilterScreenChildren(children, {
        isCustomNavigator: true,
        contextKey,
    });
    const sorted = useSortedScreens(screens ?? []);
    if (!sorted.length) {
        console.warn(`Navigator at "${contextKey}" has no children.`);
        return null;
    }
    return (React.createElement(QualifiedNavigator, { initialRouteName: initialRouteName, screenOptions: screenOptions, screens: sorted, contextKey: contextKey, router: router }, otherSlot));
}
function QualifiedNavigator({ initialRouteName, screenOptions, children, screens, contextKey, router = StackRouter, }) {
    const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(router, {
        // Used for getting the parent with navigation.getParent('/normalized/path')
        id: contextKey,
        children: screens,
        screenOptions,
        initialRouteName,
    });
    return (React.createElement(NavigatorContext.Provider, { value: {
            contextKey,
            state,
            navigation,
            descriptors,
            router,
        } },
        React.createElement(NavigationContent, null, children)));
}
export function useNavigatorContext() {
    const context = React.useContext(NavigatorContext);
    if (!context) {
        throw new Error('useNavigatorContext must be used within a <Navigator />');
    }
    return context;
}
export function useSlot() {
    const context = useNavigatorContext();
    const { state, descriptors } = context;
    const current = state.routes.find((route, i) => {
        return state.index === i;
    });
    if (!current) {
        return null;
    }
    return descriptors[current.key]?.render() ?? null;
}
/** Renders the currently selected content. */
export function Slot(props) {
    const contextKey = useContextKey();
    const context = React.useContext(NavigatorContext);
    // Ensure the context is for the current contextKey
    if (context?.contextKey !== contextKey) {
        // Qualify the content and re-export.
        return (React.createElement(Navigator, { ...props },
            React.createElement(QualifiedSlot, null)));
    }
    return React.createElement(QualifiedSlot, null);
}
export function QualifiedSlot() {
    return useSlot();
}
export function DefaultNavigator() {
    return (React.createElement(SafeAreaView, { style: { flex: 1 } },
        React.createElement(Navigator, null,
            React.createElement(QualifiedSlot, null))));
}
Navigator.Slot = Slot;
Navigator.useContext = useNavigatorContext;
/** Used to configure route settings. */
Navigator.Screen = Screen;
//# sourceMappingURL=Navigator.js.map