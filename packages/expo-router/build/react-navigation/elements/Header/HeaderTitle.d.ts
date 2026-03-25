import { Animated, type StyleProp, type TextProps, type TextStyle } from 'react-native';
type Props = Omit<TextProps, 'style'> & {
    tintColor?: string;
    children?: string;
    style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};
export declare function HeaderTitle({ tintColor, style, ...rest }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=HeaderTitle.d.ts.map