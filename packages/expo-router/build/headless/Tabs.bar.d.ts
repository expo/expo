import { ComponentType, ReactNode } from 'react';
import { View, Pressable, ViewProps, PressableProps } from 'react-native';
import { Href } from '../types';
export type TabTriggerOptions = {
    href: Href;
    initialRoute?: boolean;
};
export type TabTriggerProps<T extends typeof Pressable = typeof Pressable> = PressableProps & TabTriggerOptions & {
    as?: T;
    children: ReactNode;
};
export type TabListProps = ViewProps & {
    as?: typeof View | ComponentType<ViewProps>;
};
export declare function TabList({ as: As, ...props }: TabListProps): import("react").JSX.Element;
export declare function TabTrigger({ as: As, style, ...props }: TabTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.bar.d.ts.map