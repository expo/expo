import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import type { NativeTabOptions } from './NativeTabsView';
export type TabProps = PropsWithChildren<{
    name: string;
    hidden?: boolean;
    options?: NativeTabOptions;
    popToRoot?: boolean;
    disableScrollToTop?: boolean;
}>;
export declare function Tab(props: TabProps): null;
export declare function convertTabPropsToOptions({ options, hidden, children, popToRoot, disableScrollToTop, }: TabProps): NativeTabOptions;
export declare function isTab(child: ReactNode, contextKey?: string): child is ReactElement<TabProps & {
    name: string;
}>;
//# sourceMappingURL=TabOptions.d.ts.map