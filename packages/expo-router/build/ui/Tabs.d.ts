/// <reference types="react" />
import { ViewProps } from 'react-native';
import { UseTabsOptions } from './Tab-hooks';
export * from './Tab-shared';
export * from './Tab-hooks';
export * from './TabList';
export * from './TabSlot';
export type TabsProps = ViewProps & {
    asChild?: boolean;
    options?: UseTabsOptions;
};
export declare function Tabs({ children, asChild, options, ...props }: TabsProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map