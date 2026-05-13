import React from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { Route } from '../../native';
type Props = {
    route: Route<string>;
    variant: 'uikit' | 'material';
    size: 'compact' | 'regular';
    badge?: string | number;
    badgeStyle?: StyleProp<TextStyle>;
    activeOpacity: number;
    inactiveOpacity: number;
    activeTintColor: ColorValue;
    inactiveTintColor: ColorValue;
    renderIcon: (props: {
        focused: boolean;
        color: ColorValue;
        size: number;
    }) => React.ReactNode;
    allowFontScaling?: boolean;
    style: StyleProp<ViewStyle>;
};
export declare function TabBarIcon({ route: _, variant, size, badge, badgeStyle, activeOpacity, inactiveOpacity, activeTintColor, inactiveTintColor, renderIcon, allowFontScaling, style, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TabBarIcon.d.ts.map