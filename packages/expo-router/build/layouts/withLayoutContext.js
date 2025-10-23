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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFilterScreenChildren = useFilterScreenChildren;
exports.withLayoutContext = withLayoutContext;
const react_1 = __importStar(require("react"));
const Route_1 = require("../Route");
const NativeTabTrigger_1 = require("../native-tabs/NativeBottomTabs/NativeTabTrigger");
const useScreens_1 = require("../useScreens");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
function useFilterScreenChildren(children, { isCustomNavigator, contextKey, } = {}) {
    return (0, react_1.useMemo)(() => {
        const customChildren = [];
        const screens = [];
        const protectedScreens = new Set();
        function flattenChild(child, exclude = false) {
            if ((0, Screen_1.isScreen)(child, contextKey)) {
                if (exclude) {
                    protectedScreens.add(child.props.name);
                }
                else {
                    screens.push(child.props);
                }
                return;
            }
            if ((0, NativeTabTrigger_1.isNativeTabTrigger)(child, contextKey)) {
                if (exclude) {
                    protectedScreens.add(child.props.name);
                }
                else {
                    const options = (0, NativeTabTrigger_1.convertTabPropsToOptions)(child.props);
                    if (options.hidden === false) {
                        screens.push({
                            ...child.props,
                            options: (0, NativeTabTrigger_1.convertTabPropsToOptions)(child.props),
                        });
                    }
                    else {
                        // - hidden = undefined -> then the route was not specified in navigator
                        // - hidden = true -> then the route is hidden
                        // In this cases we should treat the tab as protected
                        protectedScreens.add(child.props.name);
                    }
                }
                return;
            }
            if ((0, Protected_1.isProtectedReactElement)(child)) {
                const excludeChildren = exclude || !child.props.guard;
                react_1.Children.forEach(child.props.children, (protectedChild) => {
                    flattenChild(protectedChild, excludeChildren);
                });
                return;
            }
            if (isCustomNavigator) {
                customChildren.push(child);
                return null;
            }
            console.warn(`Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`);
            return null;
        }
        react_1.Children.forEach(children, (child) => flattenChild(child));
        // Add an assertion for development
        if (process.env.NODE_ENV !== 'production') {
            // Assert if names are not unique
            const names = screens?.map((screen) => screen && typeof screen === 'object' && 'name' in screen && screen.name);
            if (names && new Set(names).size !== names.length) {
                throw new Error('Screen names must be unique: ' + names);
            }
        }
        return {
            screens,
            children: customChildren,
            protectedScreens,
        };
    }, [children]);
}
/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 *
 * Enables use of other built-in React Navigation navigators and other navigators built with the React Navigation custom navigator API.
 *
 * @param Nav - The navigator component to wrap.
 * @param processor - A function that processes the screens before passing them to the navigator.
 * @param useOnlyUserDefinedScreens - If true, all screens not specified as navigator's children will be ignored.
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
function withLayoutContext(Nav, processor, useOnlyUserDefinedScreens = false) {
    return Object.assign((0, react_1.forwardRef)(({ children: userDefinedChildren, ...props }, ref) => {
        const contextKey = (0, Route_1.useContextKey)();
        const { screens, protectedScreens } = useFilterScreenChildren(userDefinedChildren, {
            contextKey,
        });
        const processed = processor ? processor(screens ?? []) : screens;
        const sorted = (0, useScreens_1.useSortedScreens)(processed ?? [], protectedScreens, useOnlyUserDefinedScreens);
        // Prevent throwing an error when there are no screens.
        if (!sorted.length) {
            return null;
        }
        return <Nav {...props} id={contextKey} ref={ref} children={sorted}/>;
    }), {
        Screen: Screen_1.Screen,
        Protected: Protected_1.Protected,
    });
}
//# sourceMappingURL=withLayoutContext.js.map