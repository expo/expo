'use client';
import { createBottomTabNavigator, } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, Platform } from 'react-native';
import { withLayoutContext } from './withLayoutContext';
import { Link } from '../link/Link';
import { tabRouterOverride } from './TabRouter';
import { Protected } from '../views/Protected';
// This is the only way to access the navigator.
const BottomTabNavigator = createBottomTabNavigator().Navigator;
const ExpoTabs = withLayoutContext(BottomTabNavigator, (screens) => {
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
                        const children = Platform.OS === 'web' ? props.children : <Pressable>{props.children}</Pressable>;
                        // TODO: React Navigation types these props as Animated.WithAnimatedValue<StyleProp<ViewStyle>>
                        //       While Link expects a TextStyle. We need to reconcile these types.
                        return (<Link {...props} style={[{ display: 'flex' }, props.style]} href={href} asChild={Platform.OS !== 'web'} children={children}/>);
                    },
                },
            };
        }
        return screen;
    });
});
const Tabs = Object.assign((props) => {
    return <ExpoTabs {...props} UNSTABLE_router={tabRouterOverride}/>;
}, {
    Screen: ExpoTabs.Screen,
    Protected,
});
export default Tabs;
//# sourceMappingURL=TabsClient.js.map