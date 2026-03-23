import { type StyleProp, type TextProps, type TextStyle } from 'react-native';
type Props = Omit<TextProps, 'style'> & {
    tintColor?: string;
    children?: string;
    style?: StyleProp<TextStyle>;
};
export declare function Label({ tintColor, style, ...rest }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=Label.d.ts.map