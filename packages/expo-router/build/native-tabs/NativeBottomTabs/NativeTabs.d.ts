import { NativeTabTrigger } from './NativeTabTrigger';
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
    Trigger: typeof NativeTabTrigger;
};
//# sourceMappingURL=NativeTabs.d.ts.map