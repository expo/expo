import React, { type ComponentType, type PropsWithChildren, type ReactElement } from 'react';
import { LinkProps } from './useLinkHooks';
export declare function LinkWithPreview({ experimentalPreview, children, ...rest }: LinkProps): React.JSX.Element;
interface LinkMenuItemProps {
    title: string;
    onPress: () => void;
}
export declare function LinkMenuItem(_: LinkMenuItemProps): null;
interface LinkMenuProps {
    children: ReactElement<LinkMenuItemProps> | ReactElement<LinkMenuItemProps>[];
}
export declare function LinkMenu({ children }: LinkMenuProps): React.JSX.Element[] | null;
interface LinkPreviewProps {
    width?: number;
    height?: number;
    children?: React.ReactNode;
    Component?: ComponentType<{
        isVisible: boolean;
    }>;
}
export declare function LinkPreview({ children, Component, width, height }: LinkPreviewProps): React.JSX.Element | null;
export declare function LinkTrigger(props: PropsWithChildren): string | number | bigint | boolean | React.JSX.Element | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined;
export {};
//# sourceMappingURL=LinkWithPreview.d.ts.map