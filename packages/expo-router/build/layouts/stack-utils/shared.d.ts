import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface StackHeaderItemSharedProps {
    /**
     * Supports two approaches:
     * 1. <Stack.Header.Button>Text</Stack.Header.Button> - children as text
     * 2. children as components:<Stack.Header.Button>
     * <Icon sf="icon-name" />
     * <Label>Button Text</Label>
     * <Badge>3</Badge>
     * </Stack.Header.Button>
     */
    children?: ReactNode;
    style?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'color' | 'width'> & {
        /**
         * When set to 'transparent', the button will have no background color.
         *
         * @platform iOS 26+
         */
        backgroundColor?: 'transparent';
    }>;
    separateBackground?: boolean;
    identifier?: string;
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