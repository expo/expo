import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import type { NativeTabOptions } from './types';
export type TabProps = PropsWithChildren<{
    name: string;
    /**
     * If true, the tab will be hidden from the tab bar.
     */
    hidden?: boolean;
    /**
     * The options for the tab.
     */
    options?: Omit<NativeTabOptions, 'hidden' | 'specialEffects'>;
    /**
     * If true, the tab will not pop stack to the root when selected again.
     * @default false
     *
     * @platform ios
     */
    disablePopToTop?: boolean;
    /**
     * If true, the tab will not scroll to the top when selected again.
     * @default false
     *
     * @platform ios
     */
    disableScrollToTop?: boolean;
}>;
export declare function TabTrigger(props: TabProps): null;
export declare function convertTabPropsToOptions({ options, hidden, children, disablePopToTop, disableScrollToTop, }: TabProps): NativeTabOptions;
export declare function isTab(child: ReactNode, contextKey?: string): child is ReactElement<TabProps & {
    name: string;
}>;
//# sourceMappingURL=TabOptions.d.ts.map