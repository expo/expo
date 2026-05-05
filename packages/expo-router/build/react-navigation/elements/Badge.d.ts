import { Animated, type StyleProp, type TextProps, type TextStyle } from 'react-native';
type Props = TextProps & {
    /**
     * Whether the badge is visible
     */
    visible: boolean;
    /**
     * Content of the `Badge`.
     */
    children?: string | number;
    /**
     * Size of the `Badge`.
     */
    size?: number;
    /**
     * Style object for the tab bar container.
     */
    style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};
export declare function Badge({ children, style, visible, size, ...rest }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=Badge.d.ts.map