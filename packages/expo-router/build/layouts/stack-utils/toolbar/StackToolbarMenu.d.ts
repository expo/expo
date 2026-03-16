import type { NativeStackHeaderItemMenu, NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { type ReactNode } from 'react';
import { type ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { type StackHeaderItemSharedProps } from './shared';
export interface StackToolbarMenuProps {
    accessibilityLabel?: string | undefined;
    accessibilityHint?: string | undefined;
    /**
     * Menu content - can include icons, labels, badges and menu actions.
     *
     * @example
     * ```tsx
     * <Stack.Toolbar.Menu>
     *   <Stack.Toolbar.Icon sfSymbol="ellipsis.circle" />
     *   <Stack.Toolbar.Label>Options</Stack.Toolbar.Label>
     *   <Stack.Toolbar.MenuAction onPress={() => {}}>Action 1</Stack.Toolbar.MenuAction>
     * </Stack.Toolbar.Menu>
     * ```
     */
    children?: ReactNode | undefined;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     */
    destructive?: boolean | undefined;
    disabled?: boolean | undefined;
    /**
     * Image to display for the menu item.
     *
     * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
     */
    image?: ImageRef | undefined;
    /**
     * Whether to hide the shared background.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean | undefined;
    /**
     * Whether the menu should be hidden.
     *
     * @default false
     */
    hidden?: boolean | undefined;
    /**
     * Icon for the menu item.
     *
     * Can be an SF Symbol name or an image source.
     *
     * > **Note**: When used in `placement="bottom"`, only string SFSymbols are supported. Use the `image` prop to provide custom images.
     */
    icon?: StackHeaderItemSharedProps['icon'] | undefined;
    /**
     * Controls how image-based icons are rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon (useful for monochrome icons)
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
    /**
     * If `true`, the menu will be displayed inline.
     * This means that the menu will not be collapsed
     *
     * > **Note**: Inline menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
     */
    inline?: boolean | undefined;
    /**
     * If `true`, the menu will be displayed as a palette.
     * This means that the menu will be displayed as one row
     *
     * > **Note**: Palette menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
     */
    palette?: boolean | undefined;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * @default false
     */
    separateBackground?: boolean | undefined;
    /**
     * Style for the label of the header item.
     */
    style?: StackHeaderItemSharedProps['style'] | undefined;
    /**
     * The tint color to apply to the button item
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
     */
    tintColor?: StackHeaderItemSharedProps['tintColor'] | undefined;
    /**
     * Optional title to show on top of the menu.
     */
    title?: string | undefined;
    /**
     * @default 'plain'
     */
    variant?: StackHeaderItemSharedProps['variant'] | undefined;
    /**
     * The preferred size of the menu elements.
     *
     * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/preferredelementsize) for more information.
     *
     * @platform iOS 16.0+
     */
    elementSize?: 'auto' | 'small' | 'medium' | 'large' | undefined;
}
/**
 * Use as `Stack.Toolbar.Menu` to provide menus in iOS toolbar.
 * It accepts `Stack.Toolbar.MenuAction` and nested `Stack.Toolbar.Menu`
 * elements. Menu can be configured using both component props and child
 * elements.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Alert } from 'react-native';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => Alert.alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
export declare const StackToolbarMenu: React.FC<StackToolbarMenuProps>;
export declare function convertStackToolbarMenuPropsToRNHeaderItem(props: StackToolbarMenuProps, isBottomPlacement?: boolean): NativeStackHeaderItemMenu | undefined;
export interface StackToolbarMenuActionProps {
    /**
     * Can be an Icon, Label or string title.
     */
    children?: ReactNode | undefined;
    /**
     * If `true`, the menu item will be disabled and not selectable.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
     */
    disabled?: boolean | undefined;
    icon?: SFSymbol | ImageSourcePropType | undefined;
    /**
     * Image to display for the menu action.
     *
     * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
     */
    image?: ImageRef | undefined;
    /**
     * Controls how image-based icons are rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon (useful for monochrome icons)
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
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     */
    destructive?: boolean | undefined;
    /**
     * If `true`, the menu will be kept presented after the action is selected.
     *
     * This is marked as unstable, because when action is selected it will recreate the menu,
     * which will close all opened submenus and reset the scroll position.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
     */
    unstable_keepPresented?: boolean | undefined;
    /**
     * If `true`, the menu item will be displayed as selected.
     */
    isOn?: boolean | undefined;
    onPress?: (() => void) | undefined;
    /**
     * An elaborated title that explains the purpose of the action.
     */
    discoverabilityLabel?: string | undefined;
    /**
     * An optional subtitle for the menu item.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
     */
    subtitle?: string | undefined;
    hidden?: boolean | undefined;
}
/**
 * An action item for a `Stack.Toolbar.Menu`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarMenuAction: React.FC<StackToolbarMenuActionProps>;
export declare function convertStackToolbarMenuActionPropsToRNHeaderItem(props: StackToolbarMenuActionProps): NativeStackHeaderItemMenuAction;
//# sourceMappingURL=StackToolbarMenu.d.ts.map