/// <reference types="react" />
import { ViewProps } from 'react-native';
import { UseTabsOptions } from './Tabs.hooks';
export * from './Tabs.common';
export * from './Tabs.hooks';
export * from './Tabs.list';
export * from './Tabs.slot';
export type TabsProps = ViewProps & {
    options?: UseTabsOptions;
};
export declare function Tabs({ children, options, ...props }: TabsProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map