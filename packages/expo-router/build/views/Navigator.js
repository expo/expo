// Copyright © 2024 650 Industries.
'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultNavigator = exports.Slot = exports.useNavigatorContext = exports.Navigator = exports.NavigatorContext = void 0;
const native_1 = require("@react-navigation/native");
const React = __importStar(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Screen_1 = require("./Screen");
const Route_1 = require("../Route");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
const useScreens_1 = require("../useScreens");
exports.NavigatorContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    exports.NavigatorContext.displayName = 'NavigatorContext';
}
/**
 * An unstyled custom navigator. Good for basic web layouts.
 *
 * @hidden
 */
function Navigator({ initialRouteName, screenOptions, children, router, routerOptions, }) {
    const contextKey = (0, Route_1.useContextKey)();
    // A custom navigator can have a mix of Screen and other components (like a Slot inside a View)
    const { screens, children: nonScreenChildren } = (0, withLayoutContext_1.useFilterScreenChildren)(children, {
        isCustomNavigator: true,
        contextKey,
    });
    const sortedScreens = (0, useScreens_1.useSortedScreens)(screens ?? []);
    router ||= native_1.StackRouter;
    const navigation = (0, native_1.useNavigationBuilder)(router, {
        // Used for getting the parent with navigation.getParent('/normalized/path')
        ...routerOptions,
        id: contextKey,
        children: sortedScreens || [<Screen_1.Screen key="default"/>],
        screenOptions,
        initialRouteName,
    });
    // useNavigationBuilder requires at least one screen to be defined otherwise it will throw.
    if (!sortedScreens.length) {
        console.warn(`Navigator at "${contextKey}" has no children.`);
        return null;
    }
    return (<exports.NavigatorContext.Provider value={{
            ...navigation,
            contextKey,
            router,
        }}>
      {nonScreenChildren}
    </exports.NavigatorContext.Provider>);
}
exports.Navigator = Navigator;
/**
 * @hidden
 */
function useNavigatorContext() {
    const context = React.useContext(exports.NavigatorContext);
    if (!context) {
        throw new Error('useNavigatorContext must be used within a <Navigator />');
    }
    return context;
}
exports.useNavigatorContext = useNavigatorContext;
function SlotNavigator(props) {
    const contextKey = (0, Route_1.useContextKey)();
    // Allows adding Screen components as children to configure routes.
    const { screens } = (0, withLayoutContext_1.useFilterScreenChildren)([], {
        contextKey,
    });
    const { state, descriptors, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        ...props,
        id: contextKey,
        children: (0, useScreens_1.useSortedScreens)(screens ?? []),
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
function Slot(props) {
    const contextKey = (0, Route_1.useContextKey)();
    const context = React.useContext(exports.NavigatorContext);
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
exports.Slot = Slot;
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
function DefaultNavigator() {
    return (<react_native_safe_area_context_1.SafeAreaView style={{ flex: 1 }}>
      <SlotNavigator />
    </react_native_safe_area_context_1.SafeAreaView>);
}
exports.DefaultNavigator = DefaultNavigator;
Navigator.Slot = NavigatorSlot;
Navigator.useContext = useNavigatorContext;
/** Used to configure route settings. */
Navigator.Screen = Screen_1.Screen;
//# sourceMappingURL=Navigator.js.map