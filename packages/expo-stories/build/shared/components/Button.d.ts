import React from 'react';
import { TouchableHighlightProps, ViewStyle } from 'react-native';
interface Props extends TouchableHighlightProps {
    disabled?: boolean;
    loading?: boolean;
    title?: string;
    buttonStyle?: ViewStyle;
}
declare const Button: React.FunctionComponent<Props>;
export default Button;
