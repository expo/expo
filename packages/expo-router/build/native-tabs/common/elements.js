"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsTriggerBadge = exports.NativeTabsTriggerVectorIcon = exports.NativeTabsTriggerIcon = exports.NativeTabsTriggerLabel = void 0;
const primitives_1 = require("../../primitives");
exports.NativeTabsTriggerLabel = primitives_1.Label;
/**
 * Renders an icon for the tab.
 *
 * @platform ios
 * @platform android
 */
exports.NativeTabsTriggerIcon = primitives_1.Icon;
/**
 * Helper component which can be used to load vector icons for `NativeTabs`.
 *
 * @example
 * ```tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
 *
 * export default Layout(){
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.Trigger name="index">
 *         <NativeTabs.Trigger.Icon src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="home" />} />
 *       </NativeTabs.Trigger>
 *     </NativeTabs>
 *   );
 * }
 * ```
 */
exports.NativeTabsTriggerVectorIcon = primitives_1.VectorIcon;
exports.NativeTabsTriggerBadge = primitives_1.Badge;
//# sourceMappingURL=elements.js.map