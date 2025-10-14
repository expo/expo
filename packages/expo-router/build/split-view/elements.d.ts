import React from 'react';
import type { NativeButtonProps, SidebarContextValue, SidebarHeaderProps, SidebarHeaderSectionProps, SidebarHeaderTitleProps, SidebarTriggerProps } from './types';
export declare const ParentSideBarContext: React.Context<number>;
export declare const ChildrenSideBarContext: React.Context<SidebarContextValue>;
export declare function NativeButton({ children, style }: NativeButtonProps): React.JSX.Element;
export declare function SidebarTrigger({ children }: SidebarTriggerProps): string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null;
export declare function SidebarHeaderComponent({ children }: SidebarHeaderProps): React.JSX.Element;
export declare function SidebarHeaderTitle({ children }: SidebarHeaderTitleProps): React.JSX.Element;
export declare function SidebarHeaderRight({ children }: SidebarHeaderSectionProps): React.JSX.Element;
export declare function SidebarHeaderLeft({ children }: SidebarHeaderSectionProps): React.JSX.Element;
export declare const SidebarHeader: typeof SidebarHeaderComponent & {
    Title: typeof SidebarHeaderTitle;
    Right: typeof SidebarHeaderRight;
    Left: typeof SidebarHeaderLeft;
};
//# sourceMappingURL=elements.d.ts.map