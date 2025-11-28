import type { NativeTabsProps } from './types';
/**
 * The component used to create native tabs layout.
 *
 * @example
 * ```tsx
 * // In _layout file
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function Layout() {
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.Trigger name="home" />
 *       <NativeTabs.Trigger name="settings" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 */
export declare const NativeTabs: ((props: NativeTabsProps) => import("react").JSX.Element) & {
    Trigger: ((props: import("./types").NativeTabTriggerProps) => null) & {
        Label: import("react").FC<import("./common/elements").NativeTabsTriggerLabelProps>;
        Icon: import("react").FC<import("./common/elements").NativeTabsTriggerIconProps>;
        Badge: import("react").FC<import("./common/elements").NativeTabsTriggerBadgeProps>;
        VectorIcon: typeof import("..").VectorIcon;
    };
    BottomAccessory: import("react").FC<import("./common/elements").NativeTabsBottomAccessoryProps>;
};
//# sourceMappingURL=NativeTabs.d.ts.map