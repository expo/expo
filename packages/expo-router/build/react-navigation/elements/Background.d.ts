import * as React from 'react';
import { Animated, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
type Props = Omit<ViewProps, 'style'> & {
    style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    children: React.ReactNode;
};
export declare function Background({ style, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Background.d.ts.map