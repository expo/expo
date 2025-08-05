import React, { type FC, type PropsWithChildren, type ReactElement } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';
import { LinkProps } from './useLinkHooks';
export declare function LinkWithPreview({ children, ...rest }: LinkProps): React.JSX.Element;
interface LinkMenuActionProps {
    /**
     * The title of the menu item.
     */
    title: string;
    /**
     * Optional SF Symbol displayed alongside the menu item.
     */
    icon?: SFSymbol;
    /**
     * If true, the menu item will be disabled and not selectable.
     *
     * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled
     */
    disabled?: boolean;
    /**
     * If true, the menu item will be displayed as destructive.
     *
     * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive
     */
    destructive?: boolean;
    /**
     * If true, the menu will be kept presented after the action is selected.
     *
     * This is marked as unstable, because when action is selected it will recreate the menu,
     * which will close all opened submenus and reset the scroll position.
     *
     * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented
     */
    unstable_keepPresented?: boolean;
    /**
     * If true, the menu item will be displayed as selected.
     */
    isOn?: boolean;
    onPress: () => void;
}
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
     * If true, the menu will be displayed as a palette.
     * This means that the menu will be displayed as one row
     *
     * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette
     */
    displayAsPalette?: boolean;
    /**
     * If true, the menu will be displayed inline.
     * This means that the menu will not be collapsed
     *
     * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline
     */
    displayInline?: boolean;
    /**
     * If true, the menu item will be displayed as destructive.
     *
     * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive
     */
    destructive?: boolean;
    children: ReactElement<LinkMenuActionProps> | ReactElement<LinkMenuActionProps>[];
}
export declare const LinkMenu: FC<LinkMenuProps>;
interface LinkPreviewProps {
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
    children?: React.ReactNode;
}
export declare function LinkPreview({ children, width, height }: LinkPreviewProps): React.JSX.Element | null;
export declare function LinkTrigger(props: PropsWithChildren): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.JSX.Element | null | undefined;
export {};
//# sourceMappingURL=LinkWithPreview.d.ts.map