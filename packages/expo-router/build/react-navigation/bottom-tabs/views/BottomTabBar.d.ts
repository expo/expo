import React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { type ParamListBase, type TabNavigationState } from '../../native';
import type { BottomTabBarProps, BottomTabDescriptorMap } from '../types';
type Props = BottomTabBarProps & {
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
};
type Options = {
    state: TabNavigationState<ParamListBase>;
    descriptors: BottomTabDescriptorMap;
    dimensions: {
        height: number;
        width: number;
    };
};
export declare const getTabBarHeight: ({ state, descriptors, dimensions, insets, style, }: Options & {
    insets: EdgeInsets;
    style: Animated.WithAnimatedValue<StyleProp<ViewStyle>> | undefined;
}) => number;
export declare function BottomTabBar({ state, navigation, descriptors, insets, style }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=BottomTabBar.d.ts.map