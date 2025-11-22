import React, { type PropsWithChildren, type ReactElement } from 'react';
import type { ViewStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface LinkMenuActionProps {
    /**
     * The title of the menu item.
     */
    title: string;
    /**
     * Optional SF Symbol displayed alongside the menu item.
     */
    icon?: SFSymbol;
    /**
     * If `true`, the menu item will be disabled and not selectable.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled) for more information.
     */
    disabled?: boolean;
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
    onPress: () => void;
}
/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * > **Note**: You can use the alias `Link.MenuAction` for this component.
 *
 * @platform ios
 */
export declare function LinkMenuAction(props: LinkMenuActionProps): React.JSX.Element | null;
export interface LinkMenuProps {
    /**
     * The title of the menu item
     */
    title?: string;
    /**
     * Optional SF Symbol displayed alongside the menu item.
     */
    icon?: string;
    /**
     * If `true`, the menu will be displayed as a palette.
     * This means that the menu will be displayed as one row
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette) for more information.
     */
    displayAsPalette?: boolean;
    /**
     * If `true`, the menu will be displayed inline.
     * This means that the menu will not be collapsed
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline) for more information.
     */
    displayInline?: boolean;
    /**
     * If `true`, the menu item will be displayed as destructive.
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive) for more information.
     */
    destructive?: boolean;
    children: ReactElement<LinkMenuActionProps> | ReactElement<LinkMenuActionProps>[];
}
/**
 * Groups context menu actions for a link.
 *
 * If multiple `Link.Menu` components are used within a single `Link`, only the first will be rendered.
 * Only `Link.MenuAction` and `LinkMenuAction` components are allowed as children.
 *
 * @example
 * ```tsx
 * <Link.Menu>
 *   <Link.MenuAction title="Action 1" onPress={() => {}} />
 *   <Link.MenuAction title="Action 2" onPress={() => {}} />
 * </Link.Menu>
 * ```
 *
 * > **Note**: You can use the alias `Link.Menu` for this component.
 *
 * @platform ios
 */
export declare const LinkMenu: React.FC<LinkMenuProps>;
export type LinkPreviewStyle = Omit<ViewStyle, 'position' | 'width' | 'height'> & {
    /**
     * Sets the preferred width of the preview.
     * If not set, full width of the screen will be used.
     *
     * This is only **preferred** width, the actual width may be different
     */
    width?: number;
    /**
     * Sets the preferred height of the preview.
     * If not set, full height of the screen will be used.
     *
     * This is only **preferred** height, the actual height may be different
     */
    height?: number;
};
export interface LinkPreviewProps {
    children?: React.ReactNode;
    /**
     * Custom styles for the preview container.
     *
     * Note that some styles may not work, as they are limited or reset by the native view
     */
    style?: LinkPreviewStyle;
}
/**
 * A component used to render and customize the link preview.
 *
 * If `Link.Preview` is used without any props, it will render a preview of the `href` passed to the `Link`.
 *
 * If multiple `Link.Preview` components are used within a single `Link`, only the first one will be rendered.
 *
 * To customize the preview, you can pass custom content as children.
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Preview>
 *     <Text>Custom Preview Content</Text>
 *   </Link.Preview>
 * </Link>
 * ```
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Preview />
 * </Link>
 * ```
 *
 * > **Note**: You can use the alias `Link.Preview` for this component.
 *
 * @platform ios
 */
export declare function LinkPreview(props: LinkPreviewProps): React.JSX.Element | null;
export type LinkTriggerProps = PropsWithChildren;
/**
 * Serves as the trigger for a link.
 * The content inside this component will be rendered as part of the base link.
 *
 * If multiple `Link.Trigger` components are used within a single `Link`, only the first will be rendered.
 *
 * @example
 * ```tsx
 * <Link href="/about">
 *   <Link.Trigger>
 *     Trigger
 *   </Link.Trigger>
 * </Link>
 * ```
 *
 * > **Note**: You can use the alias `Link.Trigger` for this component.
 *
 * @platform ios
 */
export declare function LinkTrigger(props: LinkTriggerProps): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.JSX.Element | null | undefined;
//# sourceMappingURL=elements.d.ts.map