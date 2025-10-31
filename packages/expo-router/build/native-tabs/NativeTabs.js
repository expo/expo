"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabs = void 0;
// We need this file to re-export the navigator
// Otherwise rsc would fail
const NativeBottomTabsNavigator_1 = require("./NativeBottomTabsNavigator");
const NativeTabTrigger_1 = require("./NativeTabTrigger");
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
exports.NativeTabs = Object.assign((props) => {
    return <NativeBottomTabsNavigator_1.NativeTabsNavigatorWithContext {...props}/>;
}, { Trigger: NativeTabTrigger_1.NativeTabTrigger });
//# sourceMappingURL=NativeTabs.js.map