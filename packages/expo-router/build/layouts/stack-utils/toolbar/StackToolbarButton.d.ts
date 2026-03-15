import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { type ReactNode } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import { type StackHeaderItemSharedProps } from './shared';
export interface StackToolbarButtonProps {
    accessibilityLabel?: string | undefined;
    accessibilityHint?: string | undefined;
    /**
     * There are two ways to specify the content of the button:
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * export default function Page() {
     *   return (
     *     <>
     *       <Stack.Toolbar placement="left">
     *         <Stack.Toolbar.Button icon="star.fill">As text passed as children</Stack.Toolbar.Button>
     *       </Stack.Toolbar>
     *       <ScreenContent />
     *     </>
     *   );
     * }
     * ```
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * export default function Page() {
     *   return (
     *     <>
     *       <Stack.Toolbar placement="left">
     *         <Stack.Toolbar.Button>
     *           <Stack.Toolbar.Icon sf="star.fill" />
     *           <Stack.Toolbar.Label>As components</Stack.Toolbar.Label>
     *           <Stack.Toolbar.Badge>3</Stack.Toolbar.Badge>
     *         </Stack.Toolbar.Button>
     *       </Stack.Toolbar>
     *       <ScreenContent />
     *     </>
     *   );
     * }
     * ```
     *
     * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only. Badge is only supported in left/right placements, not in bottom (iOS toolbar limitation).
     */
    children?: ReactNode | undefined;
    disabled?: boolean | undefined;
    /**
     * Whether the button should be hidden.
     *
     * @default false
     */
    hidden?: boolean | undefined;
    /**
     * Whether to hide the shared background.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean | undefined;
    /**
     * Icon to display in the button.
     *
     * Can be a string representing an SFSymbol or an image source.
     *
     * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
     */
    icon?: StackHeaderItemSharedProps['icon'] | undefined;
    /**
     * Image to display in the button.
     *
     * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
     */
    image?: ImageRef | undefined;
    /**
     * Controls how image-based icons are rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon
     * - `'original'`: Preserves original icon colors (useful for multi-color icons)
     *
     * **Default behavior:**
     * - If `tintColor` is specified, defaults to `'template'`
     * - If no `tintColor`, defaults to `'original'`
     *
     * This prop only affects image-based icons (not SF Symbols).
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
     *
     * @platform ios
     */
    iconRenderingMode?: 'template' | 'original' | undefined;
    onPress?: (() => void) | undefined;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * @default false
     */
    separateBackground?: boolean | undefined;
    /**
     * Whether the button is in a selected state
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
     */
    selected?: boolean | undefined;
    /**
     * Style for the label of the header item.
     */
    style?: StyleProp<TextStyle> | undefined;
    /**
     * The tint color to apply to the button item
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
     */
    tintColor?: StackHeaderItemSharedProps['tintColor'] | undefined;
    /**
     * @default 'plain'
     */
    variant?: StackHeaderItemSharedProps['variant'] | undefined;
}
/**
 * A button used inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarButton: React.FC<StackToolbarButtonProps>;
export declare function convertStackToolbarButtonPropsToRNHeaderItem(props: StackToolbarButtonProps): NativeStackHeaderItemButton | undefined;
//# sourceMappingURL=StackToolbarButton.d.ts.map