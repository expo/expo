import React, { type ReactElement } from 'react';
import type { SplitViewColumnProps } from './elements';
export type ColumnName = 'primary' | 'supplementary' | 'secondary';
export interface SplitViewRef {
    show: (column: 'supplementary' | 'secondary') => void;
}
interface SplitViewStackProps {
    columnChildren: ReactElement<SplitViewColumnProps>[];
}
export declare const SplitViewStack: React.ForwardRefExoticComponent<SplitViewStackProps & React.RefAttributes<SplitViewRef>>;
export {};
//# sourceMappingURL=split-view-stack.d.ts.map