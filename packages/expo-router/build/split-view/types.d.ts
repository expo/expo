import type { SplitViewColumnMetrics, SplitViewDisplayMode, SplitViewSplitBehavior } from 'react-native-screens/experimental';
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
export interface SplitViewContextType {
    options: SplitViewOptions;
    setOptions: (options: Partial<SplitViewOptions>) => void;
}
export interface SplitViewProps extends SplitViewOptions {
}
//# sourceMappingURL=types.d.ts.map