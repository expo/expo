import React from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { Route } from '../../native';
type Props = {
    route: Route<string>;
    variant: 'uikit' | 'material';
    size: 'compact' | 'regular';
    badge?: string | number;
    badgeStyle?: StyleProp<TextStyle>;
    activeOpacity: number;
    inactiveOpacity: number;
    activeTintColor: string;
    inactiveTintColor: string;
    renderIcon: (props: {
        focused: boolean;
        color: string;
        size: number;
    }) => React.ReactNode;
    allowFontScaling?: boolean;
    style: StyleProp<ViewStyle>;
};
export declare function TabBarIcon({ route: _, variant, size, badge, badgeStyle, activeOpacity, inactiveOpacity, activeTintColor, inactiveTintColor, renderIcon, allowFontScaling, style, }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=TabBarIcon.d.ts.map