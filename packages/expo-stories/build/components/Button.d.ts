import * as React from 'react';
import { TouchableOpacityProps, TextProps } from 'react-native';
type ButtonProps = TouchableOpacityProps & {
    style?: Pick<TouchableOpacityProps, 'style'>;
    children?: React.ReactNode;
    labelProps?: TextProps;
    label?: string;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'ghost';
};
export declare function Button({ onPress, children, variant, label, labelProps, style, ...rest }: ButtonProps): JSX.Element;
export {};
//# sourceMappingURL=Button.d.ts.map