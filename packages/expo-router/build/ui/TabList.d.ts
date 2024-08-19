/// <reference types="react" />
import { ViewProps, PressableProps } from 'react-native';
import { Href } from '../types';
export type TabTriggerOptions<T extends string | object> = {
    name: string;
    href: Href<T>;
};
export type TabTriggerProps<T extends string | object> = PressableProps & {
    name: string;
    href?: Href<T>;
    /** Forward props to child component. Useful for custom wrappers. */
    asChild?: boolean;
};
export type TabListProps = ViewProps & {
    /** Forward props to child component and removes the extra <View />. Useful for custom wrappers. */
    asChild?: boolean;
};
export declare function TabList({ asChild, ...props }: TabListProps): import("react").JSX.Element;
export declare function TabTrigger<T extends string | object>({ asChild, name, href, ...props }: TabTriggerProps<T>): import("react").JSX.Element;
//# sourceMappingURL=TabList.d.ts.map