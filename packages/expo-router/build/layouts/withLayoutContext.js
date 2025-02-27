import React, { Children, forwardRef, isValidElement, useMemo, } from 'react';
import { useContextKey } from '../Route';
import { useSortedScreens } from '../useScreens';
import { Screen } from '../views/Screen';
export function useFilterScreenChildren(children, { isCustomNavigator, contextKey, } = {}) {
    return useMemo(() => {
        const customChildren = [];
        const screens = Children.map(children, (child) => {
            if (isValidElement(child) && child && child.type === Screen) {
                if (!child.props.name) {
                    throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
                }
                if (process.env.NODE_ENV !== 'production') {
                    if (['children', 'component', 'getComponent'].some((key) => key in child.props)) {
                        throw new Error(`<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`);
                    }
                }
                return child.props;
            }
            else {
                if (isCustomNavigator) {
                    customChildren.push(child);
                }
                else {
                    console.warn(`Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`);
                }
            }
        });
        // Add an assertion for development
        if (process.env.NODE_ENV !== 'production') {
            // Assert if names are not unique
            const names = screens?.map((screen) => screen.name);
            if (names && new Set(names).size !== names.length) {
                throw new Error('Screen names must be unique: ' + names);
            }
        }
        return {
            screens,
            children: customChildren,
        };
    }, [children]);
}
/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 *
 * Enables use of other built-in React Navigation navigators and other navigators built with the React Navigation custom navigator API.
 *
 *  @example
 * ```tsx app/_layout.tsx
 * import { ParamListBase, TabNavigationState } from "@react-navigation/native";
 * import {
 *   createMaterialTopTabNavigator,
 *   MaterialTopTabNavigationOptions,
 *   MaterialTopTabNavigationEventMap,
 * } from "@react-navigation/material-top-tabs";
 * import { withLayoutContext } from "expo-router";
 *
 * const MaterialTopTabs = createMaterialTopTabNavigator();
 *
 * const ExpoRouterMaterialTopTabs = withLayoutContext<
 *   MaterialTopTabNavigationOptions,
 *   typeof MaterialTopTabs.Navigator,
 *   TabNavigationState<ParamListBase>,
 *   MaterialTopTabNavigationEventMap
 * >(MaterialTopTabs.Navigator);

 * export default function TabLayout() {
 *   return <ExpoRouterMaterialTopTabs />;
 * }
 * ```
 */
export function withLayoutContext(Nav, processor) {
    return Object.assign(forwardRef(({ children: userDefinedChildren, ...props }, ref) => {
        const contextKey = useContextKey();
        const { screens } = useFilterScreenChildren(userDefinedChildren, {
            contextKey,
        });
        const processed = processor ? processor(screens ?? []) : screens;
        const sorted = useSortedScreens(processed ?? []);
        // Prevent throwing an error when there are no screens.
        if (!sorted.length) {
            return null;
        }
        return <Nav {...props} id={contextKey} ref={ref} children={sorted}/>;
    }), {
        Screen,
    });
}
//# sourceMappingURL=withLayoutContext.js.map