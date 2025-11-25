"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsBottomAccessory = exports.NativeTabsTriggerBadge = exports.NativeTabsTriggerPromiseIcon = exports.NativeTabsTriggerVectorIcon = exports.NativeTabsTriggerIcon = exports.NativeTabsTriggerLabel = void 0;
const primitives_1 = require("../../primitives");
exports.NativeTabsTriggerLabel = primitives_1.Label;
/**
 * Renders an icon for the tab.
 *
 * Accepts various icon sources such as SF Symbols, drawable resources, material icons, or image sources.
 *
 * Acceptable props combinations:
 * - `sf` and `drawable` - `sf` will be used for iOS icon, `drawable` for Android icon
 * - `sf` and `src` - `sf` will be used for iOS icon, `src` for Android icon
 * - `src` and `drawable` - `src` will be used for iOS icon, `drawable` for Android icon
 * - `src` only - `src` will be used for both iOS and Android icons
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
const NativeTabsTriggerPromiseIcon = function NativeTabsTriggerPromiseIcon(props) {
    return null;
};
exports.NativeTabsTriggerPromiseIcon = NativeTabsTriggerPromiseIcon;
exports.NativeTabsTriggerBadge = primitives_1.Badge;
/**
 * A [bottom accessory](https://developer.apple.com/documentation/uikit/uitabbarcontroller/bottomaccessory) for `NativeTabs` on iOS 26 and above.
 *
 * @example
 * ```tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default Layout(){
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.BottomAccessory>
 *         <YourAccessoryComponent />
 *       </NativeTabs.BottomAccessory>
 *       <NativeTabs.Trigger name="index" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 *
 * Optionally you can provide different accessories for `inline` and `regular` states:
 *
 * @example
 * ```tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default Layout(){
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.BottomAccessory forState="regular">
 *         <RegularAccessoryComponent />
 *       </NativeTabs.BottomAccessory>
 *       <NativeTabs.BottomAccessory forState="inline">
 *         <InlineAccessoryComponent />
 *       </NativeTabs.BottomAccessory>
 *       <NativeTabs.Trigger name="index" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 *
 * @platform iOS 26+
 */
const NativeTabsBottomAccessory = () => {
    return null;
};
exports.NativeTabsBottomAccessory = NativeTabsBottomAccessory;
//# sourceMappingURL=elements.js.map