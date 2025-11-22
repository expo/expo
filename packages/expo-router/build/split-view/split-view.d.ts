import React, { type ReactNode } from 'react';
import { type SplitViewHostProps } from 'react-native-screens/experimental';
import { SplitViewColumn, SplitViewInspector } from './elements';
export interface SplitViewProps extends Omit<SplitViewHostProps, 'children'> {
    children?: ReactNode;
}
declare function SplitViewNavigator({ children, ...splitViewHostProps }: SplitViewProps): React.JSX.Element;
export declare const SplitView: typeof SplitViewNavigator & {
    Column: typeof SplitViewColumn;
    Inspector: typeof SplitViewInspector;
};
export {};
//# sourceMappingURL=split-view.d.ts.map