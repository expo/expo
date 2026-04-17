import * as React from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { type NavigationProp, type ParamListBase, type RouteProp } from '../native';
type Props = {
    focused: boolean;
    modal?: boolean;
    navigation: NavigationProp<ParamListBase>;
    route: RouteProp<ParamListBase>;
    header: React.ReactNode;
    headerShown?: boolean;
    headerStatusBarHeight?: number;
    headerTransparent?: boolean;
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    children: React.ReactNode;
};
export declare function Screen(props: Props): React.JSX.Element;
export {};
//# sourceMappingURL=Screen.d.ts.map