import React from 'react';
import { SidebarTrigger } from './elements';
import type { SidebarProps } from './types';
declare function SidebarNavigator({ children, displayMode }: SidebarProps): React.JSX.Element;
export declare const Sidebar: typeof SidebarNavigator & {
    Trigger: typeof SidebarTrigger;
    Header: typeof import("./elements").SidebarHeaderComponent & {
        Title: typeof import("./elements").SidebarHeaderTitle;
        Right: typeof import("./elements").SidebarHeaderRight;
        Left: typeof import("./elements").SidebarHeaderLeft;
    };
};
export {};
//# sourceMappingURL=split-view.d.ts.map