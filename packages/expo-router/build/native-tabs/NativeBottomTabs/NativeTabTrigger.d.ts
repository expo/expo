import { type ReactElement, type ReactNode } from 'react';
import type { ExtendedNativeTabOptions, NativeTabTriggerProps } from './types';
/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
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
 *
 * @example
 * ```tsx
 * // In a tab screen
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <Label>Home</Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 *
 * **Note:** You can use the alias `NativeTabs.Trigger` for this component.
 */
export declare function NativeTabTrigger(props: NativeTabTriggerProps): null;
export declare function convertTabPropsToOptions({ options, hidden, children, disablePopToTop, disableScrollToTop, }: NativeTabTriggerProps): ExtendedNativeTabOptions;
export declare function isNativeTabTrigger(child: ReactNode, contextKey?: string): child is ReactElement<NativeTabTriggerProps & {
    name: string;
}>;
//# sourceMappingURL=NativeTabTrigger.d.ts.map