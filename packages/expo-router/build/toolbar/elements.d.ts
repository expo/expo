import { type ReactNode } from 'react';
import { type ColorValue, type StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { LinkMenuAction, type LinkMenuActionProps } from '../link/elements';
import type { BasicTextStyle } from '../utils/font';
export interface ToolbarMenuProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    children?: React.ReactNode;
    /**
     * An optional subtitle for the menu. Does not appear on `inline` menus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/subtitle) for more information.
     */
    subtitle?: string;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive) for more information.
     */
    destructive?: boolean;
    disabled?: boolean;
    hidden?: boolean;
    /**
     * Whether to hide the shared background when `sharesBackground` is enabled.
     *
     * Only available for root level menus.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Optional SF Symbol displayed alongside the menu item.
     */
    icon?: SFSymbol;
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
     * This means that the menu will be displayed as one row.
     * The `elementSize` property is ignored when palette is used, all items will be `elementSize="small"`. Use `elementSize="medium"` instead of `palette` to display actions with titles horizontally.
     *
     * > **Note**: Palette menus are only supported in submenus.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
     */
    palette?: boolean;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * > **Note**: Text buttons cannot share the background.
     *
     * This prop reverses the native behavior of `sharesBackground`.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @default false
     *
     * @platform iOS 26+
     */
    separateBackground?: boolean;
    /**
     * Style for the label of the header item.
     */
    style?: StyleProp<BasicTextStyle>;
    /**
     * The title of the menu item
     */
    title?: string;
    /**
     * Tint color for the menu icon and text.
     */
    tintColor?: ColorValue;
    /**
     * Controls the visual style of the menu when represented as a bar button.
     *
     * @default 'plain'
     */
    variant?: 'plain' | 'done' | 'prominent';
    /**
     * The preferred size of the menu elements.
     * `elementSize` property is ignored when `palette` is used.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/preferredelementsize) for more information.
     *
     * @platform iOS 16.0+
     */
    elementSize?: 'auto' | 'small' | 'medium' | 'large';
}
/**
 * Adds a context menu for to a toolbar.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarMenu: React.FC<ToolbarMenuProps>;
export type ToolbarMenuActionProps = LinkMenuActionProps;
/**
 * A single action item within a toolbar menu.
 *
 * For available props, see [`LinkMenuActionProps`](./router/#linkmenuactionprops).
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarMenuAction: typeof LinkMenuAction;
export interface ToolbarButtonProps {
    accessibilityLabel?: string;
    accessibilityHint?: string;
    /**
     * The text label for the button.
     *
     * > **Note**: When icon is used, the label will not be shown and will be used for accessibility purposes only.
     *
     * @example
     * ```tsx
     * import { Toolbar } from 'expo-router/unstable-toolbar';
     *
     * ...
     * <Toolbar.Button>This is button label</Toolbar.Button>
     * ```
     */
    children?: ReactNode;
    disabled?: boolean;
    /**
     * Whether the button should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether to hide the shared background.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * The name of the SF Symbol to display as the button icon.
     * For a list of available symbols, see [SF Symbols](https://developer.apple.com/sf-symbols/).
     */
    icon?: SFSymbol;
    /**
     * Callback function when the button is pressed.
     */
    onPress?: () => void;
    /**
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/possibletitles) for more information.
     */
    possibleTitles?: string[];
    /**
     * Whether the button is in a selected state
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information.
     */
    selected?: boolean;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * > **Note**: Text buttons cannot share the background.
     *
     * This prop reverses the native behavior of `sharesBackground`.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @default false
     *
     * @platform iOS 26+
     */
    separateBackground?: boolean;
    /**
     * Style for the label of the header item.
     */
    style?: StyleProp<BasicTextStyle>;
    /**
     * Tint color for the button icon and text.
     */
    tintColor?: ColorValue;
    /**
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/style-swift.enum) for more information.
     *
     * @default 'plain'
     */
    variant?: 'plain' | 'done' | 'prominent';
}
/**
 * A button component for use in the toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Button icon="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *   <Toolbar.Button>Text Button</Toolbar.Button>
 *   <Toolbar.Button hidden={!isSearchFocused} icon="xmark" onPress={handleClear} />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarButton: (props: ToolbarButtonProps) => import("react").JSX.Element;
export type ToolbarSpacerProps = {
    /**
     * Whether to hide the shared background when `sharesBackground` is enabled.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether the spacer should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether the spacer shares the background with adjacent toolbar items.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @platform iOS 26+
     * @default false
     */
    sharesBackground?: boolean;
    /**
     * By default, the spacer is flexible and expands to fill available space.
     * If a width is provided, it creates a [fixed-width spacer](https://developer.apple.com/documentation/uikit/uibarbuttonitem/fixedspace(_:)).
     */
    width?: number;
};
/**
 * A spacer component for the toolbar.
 * Without a width, it creates a flexible spacer that expands to fill available space.
 * With a width, it creates a fixed-width spacer.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button icon="magnifyingglass" />
 *   <Toolbar.Spacer width={20} />
 *   <Toolbar.Button icon="mic" />
 *   <Toolbar.Spacer />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarSpacer: (props: ToolbarSpacerProps) => import("react").JSX.Element;
export interface ToolbarSearchBarPlacementProps {
    /**
     * Whether to hide the shared background when `sharesBackground` is enabled.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether the search bar placed in the toolbar should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether the search bar shares the background with adjacent toolbar items.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @platform iOS 26+
     * @default false
     */
    sharesBackground?: boolean;
}
/**
 * Declares the position of a search bar within the toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * > **Note**: On iOS 26+, this component specifies where in the toolbar the search bar
 * > (configured via `Stack.SearchBar`) should appear. On iOS 18 and earlier, the search bar
 * > will be shown in the header instead.
 *
 * > **Important**: You must use `Stack.SearchBar` to configure and display the actual
 * > search bar. This component only declares its position in the toolbar.
 *
 * @example
 * ```tsx
 * <Stack.SearchBar placeholder="Search..." />
 * <Toolbar>
 *   <Toolbar.SearchBarPlacement />
 *   <Toolbar.Spacer />
 *   <Toolbar.Button icon="mic" />
 * </Toolbar>
 * ```
 *
 * @platform ios 26+
 */
export declare const ToolbarSearchBarPlacement: ({ hidesSharedBackground, hidden, sharesBackground, }: ToolbarSearchBarPlacementProps) => import("react").JSX.Element | null;
/**
 * Props for the ToolbarView component.
 *
 * @platform ios
 */
export interface ToolbarViewProps {
    /**
     * React elements to render inside the toolbar view.
     */
    children: React.ReactNode;
    /**
     * Whether the view should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether to hide the shared background when `sharesBackground` is enabled.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 18+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether to separate the background of this item from other header items.
     *
     * This prop reverses the native behavior of `sharesBackground`.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @default false
     *
     * @platform iOS 26+
     */
    separateBackground?: boolean;
}
/**
 * A custom view component for the toolbar that can contain any React elements.
 * Useful for embedding custom components.
 * It should only be used as a child of `Toolbar`.
 *
 * The items within the view will be absolutely positioned, so flexbox styles will not work as expected.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.View>
 *     <TextInput
 *       placeholder="Search"
 *       placeholderTextColor={Color.ios.placeholderText}
 *     />
 *   </Toolbar.View>
 *   <Toolbar.View separateBackground>
 *     <Pressable style={{ width: 32, height: 32 }} onPress={handlePress}>
 *       <SymbolView name="plus" size={22} />
 *     </Pressable>
 *   </Toolbar.View>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarView: ({ children, hidden, hidesSharedBackground, separateBackground, }: ToolbarViewProps) => import("react").JSX.Element;
export interface ToolbarProps {
    children?: React.ReactNode;
}
export declare const ToolbarHost: (props: ToolbarProps) => import("react").JSX.Element;
//# sourceMappingURL=elements.d.ts.map