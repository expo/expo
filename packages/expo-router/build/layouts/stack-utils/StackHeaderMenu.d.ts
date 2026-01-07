import type { NativeStackHeaderItemMenu, NativeStackHeaderItemMenuAction } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { type StackHeaderItemSharedProps } from './shared';
export interface StackHeaderMenuProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    /**
     * There are two ways to specify the content of the menu header item - using props or child components:
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * ...
     * <Stack.Header.Menu icon="star.fill" title="As props">
     *  <Stack.Header.MenuAction>Action 1</Stack.Header.MenuAction>
     * </Stack.Header.Menu>
     * ```
     *
     * @example
     * ```tsx
     * import { Stack } from 'expo-router';
     *
     * ...
     * <Stack.Header.Menu>
     *   <Stack.Header.Icon sf="star.fill" />
     *   <Stack.Header.Label>As components</Stack.Header.Label>
     *   <Stack.Header.Badge>3</Stack.Header.Badge>
     *   <Stack.Header.MenuAction>Action 1</Stack.Header.MenuAction>
     * </Stack.Header.Menu>
     * ```
     *
     * **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only.
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
     */
    icon?: StackHeaderItemSharedProps['icon'];
    /**
     * If `true`, the menu will be displayed inline.
     * This means that the menu will not be collapsed
     *
     * > **Note*: Inline menus are only supported in submenus.
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
}
/**
 * Component representing menu for `Stack.Header.Right` or `Stack.Header.Left`.
 *
 * Use as `Stack.Header.Menu` to provide top-level menus on iOS header bars.
 * It accepts `Stack.Header.MenuAction` and nested `Stack.Header.Menu`
 * elements. Menu can be configured using both component props and child
 * elements.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Alert } from 'react-native';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Menu>
 *               <Stack.Header.Label>Menu</Stack.Header.Label>
 *               <Stack.Header.Icon sf="ellipsis.circle" />
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.MenuAction isOn icon="star.fill">
 *                 Action 2
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.Menu inline>
 *                 <Stack.Header.MenuAction isOn>Sub Action</Stack.Header.MenuAction>
 *               </Stack.Header.Menu>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Menu>
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.Menu inline palette title="Icons">
 *                 <Stack.Header.MenuAction isOn icon="star.fill" />
 *                 <Stack.Header.MenuAction icon="heart.fill" />
 *               </Stack.Header.Menu>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
export declare const StackHeaderMenu: React.FC<StackHeaderMenuProps>;
export declare function convertStackHeaderMenuPropsToRNHeaderItem(props: StackHeaderMenuProps): NativeStackHeaderItemMenu | undefined;
export interface StackHeaderMenuActionProps {
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
 * An action item for a `Stack.Header.Menu`.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { Alert } from 'react-native';
 * import { Stack, Label, Icon } from 'expo-router';
 *
 * export default function ExampleScreen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Menu icon="ellipsis.circle">
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.MenuAction isOn onPress={() => Alert.alert('Action 2 pressed!')}>
 *                 <Label>Action 2</Label>
 *                 <Icon sf="star.fill" />
 *               </Stack.Header.MenuAction>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
export declare const StackHeaderMenuAction: React.FC<StackHeaderMenuActionProps>;
export declare function convertStackHeaderMenuActionPropsToRNHeaderItem(props: StackHeaderMenuActionProps): NativeStackHeaderItemMenuAction;
//# sourceMappingURL=StackHeaderMenu.d.ts.map