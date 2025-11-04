import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import { type ColorValue, type ImageSourcePropType, type StyleProp, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface StackHeaderItemSharedProps {
    /**
     * There are two ways to specify the content of the header item:
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * ...
     * <Stack.Header.Button>As text passed as children</Stack.Header.Button>
     * ```
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * ...
     * <Stack.Header.Button>
     *   <Stack.Header.Icon sf="star.fill" />
     *   <Stack.Header.Label>As components</Stack.Header.Label>
     *   <Stack.Header.Badge>3</Stack.Header.Badge>
     * </Stack.Header.Button>
     * ```
     *
     * **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only.
     */
    children?: ReactNode;
    /**
     * Style for the label of the header item.
     */
    style?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'color'> & {
        /**
         * When set to 'transparent', the button will have no background color.
         *
         * @platform iOS 26+
         */
        backgroundColor?: 'transparent';
    }>;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * @default false
     */
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