import type { ImageRef } from 'expo-image';
import type { ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType, StyleProp, TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { LinkMenuActionProps } from '../../../../link/elements';
import type { StackHeaderItemSharedProps } from '../shared';
export interface StackToolbarMenuProps {
    /**
     * Accessibility label spoken by screen readers (TalkBack/VoiceOver).
     *
     * @see [Android — Compose accessibility for graphic elements](https://developer.android.com/develop/ui/compose/accessibility/api-defaults#graphic-elements) and [Apple — Supporting VoiceOver in your app](https://developer.apple.com/documentation/uikit/supporting-voiceover-in-your-app#Update-your-apps-accessibility) for more information.
     *
     * @platform android
     * @platform ios
     */
    accessibilityLabel?: string;
    /**
     * @platform ios
     */
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
     *
     * @platform android
     * @platform ios
     */
    children?: ReactNode;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     *
     * @platform ios
     */
    destructive?: boolean;
    /**
     * @platform android
     * @platform ios
     */
    disabled?: boolean;
    /**
     * Image to display for the menu item.
     *
     * > **Note**: This prop is only supported in toolbar with `placement="bottom"`.
     *
     * @platform ios
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
     *
     * @platform android
     * @platform ios
     */
    hidden?: boolean;
    /**
     * Icon for the menu item.
     *
     * Can be an SF Symbol name or an image source.
     *
     * > **Note**: When used in `placement="bottom"` on iOS, only string SFSymbols are supported. Use the `image` prop to provide custom images.
     *
     * > **Note (Android)**: Only `ImageSourcePropType` icons are rendered at the menu root.
     * > SF Symbols and `xcasset` names are silently dropped — provide a `require()` or
     * > `{ uri }` source.
     *
     * @platform android
     * @platform ios
     */
    icon?: StackHeaderItemSharedProps['icon'];
    /**
     * Controls how image-based icons are rendered.
     *
     * - `'template'`: applies tint color to the icon (useful for monochrome icons)
     * - `'original'`: preserves original icon colors (useful for multi-color icons)
     *
     * **Default behavior on iOS:**
     * - If `tintColor` is specified, defaults to `'template'`
     * - If no `tintColor`, defaults to `'original'`
     *
     * **On Android:** defaults to `'template'`.
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
     * If `true`, the menu will be displayed inline.
     * This means that the menu will not be collapsed.
     *
     * > **Note**: Inline menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
     *
     * @platform android
     * @platform ios
     */
    inline?: boolean;
    /**
     * If `true`, the menu will be displayed as a palette.
     * This means that the menu will be displayed as one row.
     *
     * > **Note**: Palette menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
     *
     * @platform ios
     */
    palette?: boolean;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * @default false
     * @platform ios
     */
    separateBackground?: boolean;
    /**
     * Style for the label of the header item.
     *
     * @platform android
     * @platform ios
     */
    style?: StackHeaderItemSharedProps['style'];
    /**
     * The tint color to apply to the button item.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/tintcolor) for more information.
     * @see [Android documentation](https://developer.android.com/develop/ui/compose/graphics/images/customize#tint-image) for more information.
     *
     * @platform android
     * @platform ios
     */
    tintColor?: StackHeaderItemSharedProps['tintColor'];
    /**
     * Optional title to show on top of the menu.
     *
     * @platform android
     * @platform ios
     */
    title?: string;
    /**
     * @default 'plain'
     *
     * @platform ios
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
export interface NativeToolbarMenuProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    children?: ReactNode;
    subtitle?: string;
    destructive?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    hidesSharedBackground?: boolean;
    icon?: SFSymbol;
    xcassetName?: string;
    /**
     * Image to display for the menu item.
     */
    image?: ImageRef;
    imageRenderingMode?: 'template' | 'original';
    inline?: boolean;
    label?: string;
    palette?: boolean;
    separateBackground?: boolean;
    style?: StyleProp<TextStyle>;
    title?: string;
    tintColor?: ColorValue;
    variant?: 'plain' | 'done' | 'prominent';
    elementSize?: 'auto' | 'small' | 'medium' | 'large';
    /** @platform android */
    source?: ImageSourcePropType;
}
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
    /**
     * Icon for the menu action.
     *
     * Can be an SF Symbol name or an image source.
     *
     * > **Note (Android)**: Only `ImageSourcePropType` icons are rendered. SF Symbols are
     * > silently dropped. Provide a `require()` or `{ uri }` source.
     */
    icon?: SFSymbol | ImageSourcePropType;
    /**
     * Image to display for the menu action.
     *
     * > **Note**: This prop is only supported in `Stack.Toolbar.Bottom`.
     *
     * @platform ios
     */
    image?: ImageRef;
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
    iconRenderingMode?: 'template' | 'original';
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive) for more information.
     *
     * @platform android
     * @platform ios
     */
    destructive?: boolean;
    /**
     * If `true`, the menu will be kept presented after the action is selected.
     *
     * This is marked as unstable, because when action is selected on iOS it will recreate
     * the menu, which will close all opened submenus and reset the scroll position.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented) for more information.
     *
     * @platform android
     * @platform ios
     */
    unstable_keepPresented?: boolean;
    /**
     * If `true`, the menu item will be displayed as selected.
     *
     * @platform android
     * @platform ios
     */
    isOn?: boolean;
    onPress?: () => void;
    /**
     * An elaborated title that explains the purpose of the action.
     *
     * @platform ios
     */
    discoverabilityLabel?: string;
    /**
     * An optional subtitle for the menu item.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
     *
     * @platform ios
     */
    subtitle?: string;
    hidden?: boolean;
}
export interface NativeToolbarMenuActionProps extends LinkMenuActionProps {
    /** @platform android */
    source?: ImageSourcePropType;
}
//# sourceMappingURL=types.d.ts.map