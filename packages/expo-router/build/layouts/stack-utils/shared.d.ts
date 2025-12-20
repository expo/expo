import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import { type ColorValue, type ImageSourcePropType, type StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { type BasicTextStyle } from '../../utils/font';
export interface StackHeaderItemSharedProps {
    children?: ReactNode;
    style?: StyleProp<BasicTextStyle>;
    hidesSharedBackground?: boolean;
    separateBackground?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    disabled?: boolean;
    tintColor?: ColorValue;
    icon?: SFSymbol | ImageSourcePropType;
    /**
     * @default 'plain'
     */
    variant?: 'plain' | 'done' | 'prominent';
}
type RNSharedHeaderItem = Pick<NativeStackHeaderItemButton, 'label' | 'labelStyle' | 'icon' | 'variant' | 'tintColor' | 'disabled' | 'width' | 'hidesSharedBackground' | 'sharesBackground' | 'identifier' | 'badge' | 'accessibilityLabel' | 'accessibilityHint'>;
export declare function convertStackHeaderSharedPropsToRNSharedHeaderItem(props: StackHeaderItemSharedProps): RNSharedHeaderItem;
export {};
//# sourceMappingURL=shared.d.ts.map