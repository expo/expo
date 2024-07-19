import { ComponentType, PropsWithChildren } from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { Href } from '../types';
import { PressableProps } from '../views/Pressable';
export type TabTriggerOptions = {
    href: Href;
    initialRoute?: boolean;
};
export type TabTriggerProps = PropsWithChildren<TabTriggerOptions & {
    as?: typeof Pressable | ComponentType<PressableProps>;
}>;
export type TabListProps = PropsWithChildren<ViewProps & {
    as?: typeof View | ComponentType<ViewProps>;
}>;
export declare function TabList({ as: As, style, ...props }: TabListProps): import("react").JSX.Element;
export declare function TabTrigger({ as: As, ...props }: TabTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=Tabs.bar.d.ts.map