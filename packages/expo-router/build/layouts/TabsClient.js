"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const withLayoutContext_1 = require("./withLayoutContext");
const Link_1 = require("../link/Link");
const TabRouter_1 = require("./TabRouter");
// This is the only way to access the navigator.
const BottomTabNavigator = (0, bottom_tabs_1.createBottomTabNavigator)().Navigator;
const ExpoTabs = (0, withLayoutContext_1.withLayoutContext)(BottomTabNavigator, (screens) => {
    // Support the `href` shortcut prop.
    return screens.map((screen) => {
        if (typeof screen.options !== 'function' && screen.options?.href !== undefined) {
            const { href, ...options } = screen.options;
            if (options.tabBarButton) {
                throw new Error('Cannot use `href` and `tabBarButton` together.');
            }
            return {
                ...screen,
                options: {
                    ...options,
                    tabBarItemStyle: href == null ? { display: 'none' } : options.tabBarItemStyle,
                    // @ts-expect-error: TODO(@kitten): This isn't properly typed
                    tabBarButton: (props) => {
                        if (href == null) {
                            return null;
                        }
                        const children = react_native_1.Platform.OS === 'web' ? props.children : <react_native_1.Pressable>{props.children}</react_native_1.Pressable>;
                        // TODO: React Navigation types these props as Animated.WithAnimatedValue<StyleProp<ViewStyle>>
                        //       While Link expects a TextStyle. We need to reconcile these types.
                        return (<Link_1.Link {...props} style={[{ display: 'flex' }, props.style]} href={href} asChild={react_native_1.Platform.OS !== 'web'} children={children}/>);
                    },
                },
            };
        }
        return screen;
    });
});
const Tabs = Object.assign((props) => {
    return <ExpoTabs {...props} UNSTABLE_router={TabRouter_1.tabRouterOverride}/>;
}, {
    Screen: ExpoTabs.Screen,
});
exports.default = Tabs;
//# sourceMappingURL=TabsClient.js.map