"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = Screen;
exports.isScreen = isScreen;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const useNavigation_1 = require("../useNavigation");
const useSafeLayoutEffect_1 = require("./useSafeLayoutEffect");
/** Component for setting the current screen's options dynamically. */
function Screen({ name, options }) {
    const route = (0, native_1.useRoute)();
    // The type of this is *any* NavigationProp, but its typed like this to get the types for preloadedRoutes
    const navigation = (0, useNavigation_1.useNavigation)();
    const isFocused = navigation.isFocused();
    const navigationState = navigation.getState();
    const isPreloaded = 'preloadedRoutes' in navigationState
        ? navigationState.preloadedRoutes?.some((preloaded) => {
            return preloaded.key === route.key;
        })
        : false;
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (options && Object.keys(options).length) {
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            if (!isPreloaded || (isPreloaded && isFocused)) {
                navigation.setOptions(options);
            }
        }
    }, [isFocused, isPreloaded, navigation, options]);
    return null;
}
function isScreen(child, contextKey) {
    if ((0, react_1.isValidElement)(child) && child && child.type === Screen) {
        if (typeof child.props === 'object' &&
            child.props &&
            'name' in child.props &&
            !child.props.name) {
            throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['children', 'component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=Screen.js.map