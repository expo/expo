import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import type { SplitViewColumnMetrics, SplitViewDisplayMode, SplitViewSplitBehavior } from 'react-native-screens/experimental';
import type { Href } from '../types';
export interface BaseColumnProps {
    name?: string;
}
export interface SplitViewOptions {
    columnMetrics?: SplitViewColumnMetrics;
    disableSidebar?: boolean;
    disableGestures?: boolean;
    preferredDisplayMode?: SplitViewDisplayMode;
    preferredSplitBehavior?: SplitViewSplitBehavior;
    showSecondaryToggleButton?: boolean;
}
export interface SplitViewProps extends SplitViewOptions {
}
export interface SidebarProps {
    children?: ReactNode;
    displayMode?: 'over' | 'beside' | undefined;
}
export interface SidebarTriggerProps {
    children?: ReactNode;
    href: Href;
    notCollapsible?: boolean;
}
export interface NativeButtonProps {
    children?: ReactNode;
    style?: TextStyle;
}
export interface SidebarHeaderProps {
    children?: ReactNode;
}
export interface SidebarHeaderTitleProps {
    children?: ReactNode;
    large?: boolean;
}
export interface SidebarHeaderSectionProps {
    children?: ReactNode;
}
//# sourceMappingURL=types.d.ts.map