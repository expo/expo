import React, { type PropsWithChildren, type ReactElement } from 'react';
import { LinkProps } from './useLinkHooks';
export declare function LinkWithPreview({ children, ...rest }: LinkProps): React.JSX.Element;
interface LinkMenuAction {
    /**
     * The title of the menu item.
     */
    title: string;
    onPress: () => void;
}
export declare function LinkMenuAction(_: LinkMenuAction): null;
interface LinkMenuProps {
    children: ReactElement<LinkMenuAction> | ReactElement<LinkMenuAction>[];
}
export declare function LinkMenu({ children }: LinkMenuProps): React.JSX.Element[] | null;
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