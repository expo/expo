import { Animated, type ColorValue, type StyleProp, type TextProps, type TextStyle } from 'react-native';
type Props = Omit<TextProps, 'style'> & {
    tintColor?: ColorValue;
    children?: string;
    style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};
export declare function HeaderTitle({ tintColor, style, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeaderTitle.d.ts.map