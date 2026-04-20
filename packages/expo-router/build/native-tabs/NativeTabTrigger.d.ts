import { type ReactElement, type ReactNode } from 'react';
import { type NativeTabsTriggerBadgeProps, type NativeTabsTriggerLabelProps, type NativeTabsTriggerIconProps } from './common/elements';
import type { NativeTabOptions, NativeTabTriggerProps } from './types';
/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
 *
 * @example
 * ```tsx app/_layout.tsx
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
 *
 * @example
 * ```tsx app/home.tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 * ```
 */
declare function NativeTabTriggerImpl(props: NativeTabTriggerProps): null;
export declare const NativeTabTrigger: typeof NativeTabTriggerImpl & {
    Label: import("react").FC<NativeTabsTriggerLabelProps>;
    Icon: import("react").FC<NativeTabsTriggerIconProps>;
    Badge: import("react").FC<NativeTabsTriggerBadgeProps>;
    VectorIcon: typeof import("..").VectorIcon;
};
export declare function convertTabPropsToOptions({ hidden, children, role, disablePopToTop, disableScrollToTop, unstable_nativeProps, disableAutomaticContentInsets, contentStyle, disableTransparentOnScrollEdge, }: NativeTabTriggerProps, isDynamic?: boolean): NativeTabOptions;
export declare function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps): void;
export declare function isNativeTabTrigger(child: ReactNode, contextKey?: string): child is ReactElement<NativeTabTriggerProps & {
    name: string;
}>;
export {};
//# sourceMappingURL=NativeTabTrigger.d.ts.map