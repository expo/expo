import { Label, Icon, Badge, VectorIcon } from '../../primitives';
export const NativeTabsTriggerLabel = Label;
/**
 * Renders an icon for the tab.
 *
 * Accepts various icon sources such as SF Symbols, xcasset images, drawable resources, material icons, or image sources.
 *
 * Acceptable props combinations:
 * - `sf` and `drawable` - `sf` will be used for iOS icon, `drawable` for Android icon
 * - `sf` and `src` - `sf` will be used for iOS icon, `src` for Android icon
 * - `xcasset` and `drawable` - `xcasset` will be used for iOS icon, `drawable` for Android icon
 * - `xcasset` and `md` - `xcasset` will be used for iOS icon, `md` for Android icon
 * - `xcasset` and `src` - `xcasset` will be used for iOS icon, `src` for Android icon
 * - `src` and `drawable` - `src` will be used for iOS icon, `drawable` for Android icon
 * - `src` only - `src` will be used for both iOS and Android icons
 *
 * Priority on iOS: `sf` > `xcasset` > `src`. Priority on Android: `drawable` > `md` > `src`.
 *
 * @platform ios
 * @platform android
 */
export const NativeTabsTriggerIcon = Icon;
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
export const NativeTabsTriggerVectorIcon = VectorIcon;
export const NativeTabsTriggerPromiseIcon = function NativeTabsTriggerPromiseIcon(props) {
    return null;
};
export const NativeTabsTriggerBadge = Badge;
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
 * @platform iOS 26+
 */
export const NativeTabsBottomAccessory = () => {
    return null;
};
//# sourceMappingURL=elements.js.map