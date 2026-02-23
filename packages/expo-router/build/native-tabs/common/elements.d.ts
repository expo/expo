import type { AndroidSymbol } from 'expo-symbols';
import type { ColorValue, ImageSourcePropType, StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import { VectorIcon } from '../../primitives';
import type { NativeTabsLabelStyle } from '../types';
export interface NativeTabsTriggerLabelProps {
    /**
     * The text to display as the label for the tab.
     */
    children?: string;
    selectedStyle?: StyleProp<NativeTabsLabelStyle>;
    /**
     * If true, the label will be hidden.
     * @default false
     */
    hidden?: boolean;
}
export declare const NativeTabsTriggerLabel: React.FC<NativeTabsTriggerLabelProps>;
export interface SrcIcon {
    /**
     * The image source to use as an icon.
     *
     * When `sf` prop is used it will override this prop on iOS.
     *
     * When `drawable` or `material` prop is used it will override this prop on Android.
     *
     * The value can be provided in two ways:
     * - As an image source
     * - As an object specifying the default and selected states
     *
     * @example
     * ```tsx
     * <Icon src={require('./path/to/icon.png')} />
     * ```
     *
     * @example
     * ```tsx
     * <Icon src={{ default: require('./path/to/icon.png'), selected: require('./path/to/icon-selected.png') }} />
     * ```
     *
     * @platform Android
     * @platform iOS
     */
    src?: ImageSourcePropType | React.ReactElement | {
        default?: ImageSourcePropType | React.ReactElement;
        selected: ImageSourcePropType | React.ReactElement;
    };
    /**
     * Controls how the image icon is rendered on iOS.
     *
     * - `'template'`: iOS applies tint color to the icon (selected/unselected states)
     * - `'original'`: Preserves original icon colors
     *
     * **Default behavior:**
     * - If tab bar icon color is configured, defaults to `'template'`
     * - If no icon color is set, defaults to `'original'`
     *
     * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
     *
     * @platform ios
     */
    renderingMode?: 'template' | 'original';
}
export interface SFSymbolIcon {
    /**
     * The name of the SF Symbol to use as an icon.
     *
     * The value can be provided in two ways:
     * - As a string with the SF Symbol name
     * - As an object specifying the default and selected states
     *
     * @example
     * ```tsx
     * <Icon sf="magnifyingglass" />
     * ```
     *
     * @example
     * ```tsx
     * <Icon sf={{ default: "house", selected: "house.fill" }} />
     * ```
     *
     * @platform iOS
     */
    sf?: SFSymbol | {
        default?: SFSymbol;
        selected: SFSymbol;
    };
}
export interface XcassetIcon {
    /**
     * The name of the iOS asset catalog image to use as an icon.
     *
     * Xcassets provide automatic multi-resolution (@1x/@2x/@3x), dark mode variants,
     * and device-specific images via `[UIImage imageNamed:]`.
     *
     * The rendering mode (template vs original) can be controlled via the `renderingMode` prop
     * on the `Icon` component. By default, icons are tinted when `iconColor` is set, and
     * rendered as original otherwise.
     *
     * The value can be provided in two ways:
     * - As a string with the asset catalog image name
     * - As an object specifying the default and selected states
     *
     * @example
     * ```tsx
     * <Icon xcasset="custom-icon" />
     * ```
     *
     * @example
     * ```tsx
     * <Icon xcasset={{ default: "home-outline", selected: "home-filled" }} />
     * ```
     *
     * @platform iOS
     */
    xcasset?: string | {
        default?: string;
        selected: string;
    };
}
export interface DrawableIcon {
    /**
     * The name of the drawable resource to use as an icon.
     * @platform android
     */
    drawable?: string;
}
/**
 * Material icon name for Android native tabs.
 *
 * @platform android
 */
export interface MaterialIcon {
    /**
     * Material icon glyph name. See the [Material icons for the complete catalog](https://fonts.google.com/icons).
     */
    md: AndroidSymbol;
}
export type BaseNativeTabsTriggerIconProps = {
    selectedColor?: ColorValue;
};
export type NativeTabsTriggerIconProps = BaseNativeTabsTriggerIconProps & ((SFSymbolIcon & DrawableIcon) | (SFSymbolIcon & MaterialIcon) | (SFSymbolIcon & SrcIcon) | (XcassetIcon & DrawableIcon) | (XcassetIcon & MaterialIcon) | (XcassetIcon & SrcIcon) | (MaterialIcon & SrcIcon) | (DrawableIcon & SrcIcon) | SrcIcon);
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
export declare const NativeTabsTriggerIcon: React.FC<NativeTabsTriggerIconProps>;
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
export declare const NativeTabsTriggerVectorIcon: typeof VectorIcon;
export interface NativeTabsTriggerPromiseIconProps {
    loader: () => Promise<ImageSourcePropType | null>;
}
export declare const NativeTabsTriggerPromiseIcon: (props: NativeTabsTriggerPromiseIconProps) => null;
export interface NativeTabsTriggerBadgeProps {
    /**
     * The text to display as the badge for the tab.
     * If not provided, the badge will not be displayed.
     */
    children?: string;
    /**
     * If true, the badge will be hidden.
     * @default false
     */
    hidden?: boolean;
    selectedBackgroundColor?: ColorValue;
}
export declare const NativeTabsTriggerBadge: React.FC<NativeTabsTriggerBadgeProps>;
export interface NativeTabsBottomAccessoryProps {
    children?: React.ReactNode;
}
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
export declare const NativeTabsBottomAccessory: React.FC<NativeTabsBottomAccessoryProps>;
//# sourceMappingURL=elements.d.ts.map