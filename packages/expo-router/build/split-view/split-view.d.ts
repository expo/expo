import React, { type ReactNode } from 'react';
import { type SplitHostProps } from 'react-native-screens/experimental';
import { SplitViewColumn, SplitViewInspector } from './elements';
export type { SplitViewRef } from './split-view-stack';
/**
 * For full list of supported props, see [`SplitHostProps`](http://github.com/software-mansion/react-native-screens/blob/main/src/components/gamma/split/SplitHost.types.ts#L117)
 */
export interface SplitViewProps extends Omit<SplitHostProps, 'children'> {
    children?: ReactNode;
}
export declare const SplitView: React.ForwardRefExoticComponent<SplitViewProps & React.RefAttributes<import("./split-view-stack").SplitViewRef>> & {
    Column: typeof SplitViewColumn;
    Inspector: typeof SplitViewInspector;
};
//# sourceMappingURL=split-view.d.ts.map