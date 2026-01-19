import type { NativeStackHeaderItemMenu, NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import type { ImageRef } from 'expo-image';
import { type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { type StackHeaderItemSharedProps } from '../shared';
export interface StackToolbarMenuProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
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
    children?: ReactNode;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     */
    destructive?: boolean;
    disabled?: boolean;
    /**
     * Image to display for the menu item.
     *
     * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
     */
    image?: ImageRef;
    /**
     * Whether to hide the shared background.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether the menu should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Icon for the menu item.
     *
     * Can be an SF Symbol name or an image source.
     *
     * > **Note**: When used in placement="bottom", only string SFSymbols are supported. Use the `image` prop to provide custom images.
     */
    icon?: StackHeaderItemSharedProps['icon'];
    /**
     * If `true`, the menu will be displayed inline.
     * This means that the menu will not be collapsed
     *
     * > **Note**: Inline menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
     */
    inline?: boolean;
    /**
     * If `true`, the menu will be displayed as a palette.
     * This means that the menu will be displayed as one row
     *
     * > **Note**: Palette menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
     */
    palette?: boolean;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * @default false
     */
    separateBackground?: boolean;
    /**
     * Style for the label of the header item.
     */
    style?: StackHeaderItemSharedProps['style'];
    /**
     * The tint color to apply to the button item
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
     */
    tintColor?: StackHeaderItemSharedProps['tintColor'];
    /**
     * Optional title to show on top of the menu.
     */
    title?: string;
    /**
     * @default 'plain'
     */
    variant?: StackHeaderItemSharedProps['variant'];
    /**
     * The preferred size of the menu elements.
     *
     * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/preferredelementsize) for more information.
     *
     * @platform iOS 16.0+
     */
    elementSize?: 'auto' | 'small' | 'medium' | 'large';
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
export declare function convertStackToolbarMenuPropsToRNHeaderItem(props: StackToolbarMenuProps): NativeStackHeaderItemMenu | undefined;
export interface StackToolbarMenuActionProps {
    /**
     * Can be an Icon, Label or string title.
     */
    children?: ReactNode;
    /**
     * If `true`, the menu item will be disabled and not selectable.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
     */
    disabled?: boolean;
    icon?: SFSymbol | ImageSourcePropType;
    /**
     * Image to display for the menu action.
     *
     * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
     */
    image?: ImageRef;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     */
    destructive?: boolean;
    /**
     * If `true`, the menu will be kept presented after the action is selected.
     *
     * This is marked as unstable, because when action is selected it will recreate the menu,
     * which will close all opened submenus and reset the scroll position.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
     */
    unstable_keepPresented?: boolean;
    /**
     * If `true`, the menu item will be displayed as selected.
     */
    isOn?: boolean;
    onPress?: () => void;
    /**
     * An elaborated title that explains the purpose of the action.
     */
    discoverabilityLabel?: string;
    /**
     * An optional subtitle for the menu item.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
     */
    subtitle?: string;
    hidden?: boolean;
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