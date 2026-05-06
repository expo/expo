import { type ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { NativeStackHeaderItemButton } from '../../../react-navigation/native-stack';
import { type BasicTextStyle } from '../../../utils/font';
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
     * Controls how image-based icons are rendered.
     *
     * - `'template'`: applies tint color to the icon
     * - `'original'`: preserves original icon colors (useful for multi-color icons)
     *
     * **Default behavior on iOS:**
     * - If `tintColor` is specified, defaults to `'template'`
     * - If no `tintColor`, defaults to `'original'`
     *
     * **On Android:** defaults to `'template'`. The icon is always rendered through
     * Compose's `Icon` and tinted unless `'original'` is set explicitly.
     *
     * This prop only affects image-based icons (not SF Symbols).
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
     *
     * @platform android
     * @platform ios
     */
    iconRenderingMode?: 'template' | 'original';
    /**
     * @default 'plain'
     */
    variant?: 'plain' | 'done' | 'prominent';
}
type RNSharedHeaderItem = Pick<NativeStackHeaderItemButton, 'label' | 'labelStyle' | 'icon' | 'variant' | 'tintColor' | 'disabled' | 'width' | 'hidesSharedBackground' | 'sharesBackground' | 'identifier' | 'badge' | 'accessibilityLabel' | 'accessibilityHint'>;
/** @internal */
export declare function extractXcassetName(props: StackHeaderItemSharedProps): string | undefined;
/**
 * Extracts the rendering mode from the Icon child component (for `src` and `xcasset` variants).
 * Returns undefined if no explicit rendering mode is set on the Icon child.
 * @internal
 */
export declare function extractIconRenderingMode(props: StackHeaderItemSharedProps): 'template' | 'original' | undefined;
export declare function areAllChildrenPrimitiveValues(children: ReactNode): boolean;
export declare function convertChildrenToString(children: ReactNode): string;
export declare function convertStackHeaderSharedPropsToRNSharedHeaderItem(props: StackHeaderItemSharedProps, isBottomPlacement?: boolean): RNSharedHeaderItem;
export {};
//# sourceMappingURL=shared.d.ts.map