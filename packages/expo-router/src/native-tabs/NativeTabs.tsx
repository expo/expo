// We need this file to re-export the navigator
// Otherwise rsc would fail
import { NativeTabsNavigatorWrapper } from './NativeBottomTabsNavigator';
import { NativeTabTrigger } from './NativeTabTrigger';
import { NativeTabsBottomAccessory } from './common/elements';
import { usePlacement } from './hooks';
import type { NativeTabsProps } from './types';
import { isNewStateModelEnabled } from '../navigation-state/enable';
import { NativeTabs as NewNativeTabs } from '../navigation-state/render/createNativeTabsNavigator';

const BottomAccessory = Object.assign(NativeTabsBottomAccessory, {
  usePlacement,
});

/**
 * The component used to create native tabs layout.
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
 */
export const NativeTabs = Object.assign(
  // Flag swap (Decisions R-3): flag off = the exact old NativeTabs.
  (props: NativeTabsProps) =>
    isNewStateModelEnabled() ? (
      <NewNativeTabs>{props.children}</NewNativeTabs>
    ) : (
      <NativeTabsNavigatorWrapper {...props} />
    ),
  { Trigger: NativeTabTrigger, BottomAccessory }
);
