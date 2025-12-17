import { type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { LinkMenuAction, type LinkMenuActionProps, type LinkMenuProps } from '../link/elements';
/**
 * For available props, see [`LinkMenuProps`](./router/#linkmenuprops).
 *
 * @platform ios
 */
export interface ToolbarMenuProps extends LinkMenuProps {
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
     * Whether the button shares the background with adjacent toolbar items.
     *
     * > **Note**: Text buttons cannot share the background.
     *
     * Only available for root level menus.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/sharesbackground) for more information.
     *
     * @default true
     *
     * @platform iOS 26+
     */
    sharesBackground?: boolean;
}
/**
 * Adds a context menu for to a toolbar.
 *
 * For available props, see [`LinkMenuProps`](./router/#linkmenuprops).
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
export declare const ToolbarMenu: import("react").FC<LinkMenuProps>;
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
    children?: string;
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
    /**
     * Style properties for the view.
     * Note: Position-related styles (position, inset, top, left, right, bottom, flex) are not allowed.
     */
    style?: StyleProp<Omit<ViewStyle, 'position' | 'inset' | 'top' | 'left' | 'right' | 'bottom' | 'flex'>>;
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
 *   <Toolbar.View style={{ width: 200 }}>
 *     <TextInput
 *       placeholder="Search"
 *       placeholderTextColor={Color.ios.placeholderText}
 *     />
 *   </Toolbar.View>
 *   <Toolbar.View separateBackground style={{ width: 32, height: 32 }}>
 *     <Pressable onPress={handlePress}>
 *       <SymbolView name="plus" size={22} />
 *     </Pressable>
 *   </Toolbar.View>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
export declare const ToolbarView: ({ children, hidden, hidesSharedBackground, separateBackground, style, }: ToolbarViewProps) => import("react").JSX.Element;
export interface ToolbarProps {
    children?: React.ReactNode;
}
export declare const ToolbarHost: (props: ToolbarProps) => import("react").JSX.Element;
//# sourceMappingURL=elements.d.ts.map