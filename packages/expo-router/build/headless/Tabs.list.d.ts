import { ReactNode } from 'react';
import { ViewProps } from 'react-native';
import { LinkProps } from '../link/Link';
import { ScreenTrigger } from './common';
export type TabTriggerOptions<T extends string | object> = ScreenTrigger<T>;
export type TabTriggerProps<T extends string | object> = LinkProps<T> & TabTriggerOptions<T> & {
    children: ReactNode;
};
export type TabListProps = ViewProps & {
    /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
    asChild?: boolean;
};
export declare function TabList({ asChild, ...props }: TabListProps): import("react").JSX.Element;
export declare function TabTrigger<T extends string | object>(props: TabTriggerProps<T>): import("react").JSX.Element;
//# sourceMappingURL=Tabs.list.d.ts.map