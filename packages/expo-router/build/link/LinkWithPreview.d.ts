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
    onPress: () => void;
}
export declare function LinkMenuAction(_: LinkMenuActionProps): null;
export interface LinkMenuProps {
    /**
     * The title of the menu item
     */
    title?: string;
    /**
     * Optional SF Symbol displayed alongside the menu item.
     */
    icon?: string;
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