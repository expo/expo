// We need this file to re-export the navigator
// Otherwise rsc would fail
import { NativeTabsNavigatorWrapper } from './NativeBottomTabsNavigator';
import { NativeTabTrigger } from './NativeTabTrigger';
import { NativeTabsBottomAccessory } from './common/elements';
import { usePlacement } from './hooks';
import type { NativeTabsProps } from './types';

const BottomAccessory = Object.assign(NativeTabsBottomAccessory, {
  usePlacement,
});

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
export const NativeTabs = Object.assign(
  (props: NativeTabsProps) => {
    return <NativeTabsNavigatorWrapper {...props} />;
  },
  { Trigger: NativeTabTrigger, BottomAccessory }
);
