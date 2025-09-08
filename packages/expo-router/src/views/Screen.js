'use client';
import { useRoute } from '@react-navigation/native';
import { isValidElement } from 'react';
import { useNavigation } from '../useNavigation';
import { useSafeLayoutEffect } from './useSafeLayoutEffect';
import { isRoutePreloadedInStack } from '../utils/stack';
/** Component for setting the current screen's options dynamically. */
export function Screen({ name, options }) {
    if (name) {
        throw new Error(`The name prop on the Screen component may only be used when it is inside a Layout route`);
    }
    const route = useRoute();
    const navigation = useNavigation();
    const isFocused = navigation.isFocused();
    const isPreloaded = isRoutePreloadedInStack(navigation.getState(), route);
    useSafeLayoutEffect(() => {
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
export function isScreen(child, contextKey) {
    if (isValidElement(child) && child && child.type === Screen) {
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