/// <reference types="react" />
import { TouchableOpacityProps, TextProps } from 'react-native';
type ListRowProps = TouchableOpacityProps & {
    style?: Pick<TouchableOpacityProps, 'style'>;
    labelProps?: TextProps;
    label?: string;
    variant?: 'primary' | 'secondary' | 'tertiary' | 'transparent' | 'ghost';
    multiSelectActive?: boolean;
    isSelected?: boolean;
};
export declare function ListRow({ onPress, variant, label, labelProps, style, multiSelectActive, isSelected, ...rest }: ListRowProps): JSX.Element;
export {};
//# sourceMappingURL=ListRow.d.ts.map