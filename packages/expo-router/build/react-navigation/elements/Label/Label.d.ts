import { type ColorValue, type StyleProp, type TextProps, type TextStyle } from 'react-native';
type Props = Omit<TextProps, 'style'> & {
    tintColor?: ColorValue;
    children?: string;
    style?: StyleProp<TextStyle>;
};
export declare function Label({ tintColor, style, ...rest }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Label.d.ts.map