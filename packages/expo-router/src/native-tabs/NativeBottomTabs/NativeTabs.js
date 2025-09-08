import { NativeTabsNavigatorWithContext } from './NativeBottomTabsNavigator';
import { NativeTabTrigger } from './NativeTabTrigger';
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
export const NativeTabs = Object.assign((props) => {
    return <NativeTabsNavigatorWithContext {...props}/>;
}, { Trigger: NativeTabTrigger });
//# sourceMappingURL=NativeTabs.js.map