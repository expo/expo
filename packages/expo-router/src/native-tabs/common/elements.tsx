import type { AndroidSymbol } from 'expo-symbols';
import type { ColorValue, ImageSourcePropType, StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Label, Icon, Badge, VectorIcon } from '../../primitives';
import type { IconRenderingMode, NativeTabsLabelStyle } from '../types';

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

export const NativeTabsTriggerLabel: React.FC<NativeTabsTriggerLabelProps> = Label;

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
  src?:
    | ImageSourcePropType
    | React.ReactElement
    | {
        default?: ImageSourcePropType | React.ReactElement;
        selected: ImageSourcePropType | React.ReactElement;
      };
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
  sf?: SFSymbol | { default?: SFSymbol; selected: SFSymbol };
}

export interface XcassetIcon {
  /**
   * The name of the iOS asset catalog image to use as an icon.
   *
   * Xcassets provide automatic multi-resolution (@1x/@2x/@3x), dark mode variants,
   * and device-specific images via `[UIImage imageNamed:]`. Both image sets and
   * symbol sets are supported.
   *
   * > **Note:** The rendering mode comes from the asset's **Render As** setting in the
   * > asset catalog, not from the `renderingMode` prop. Set it to **Template Image** for
   * > the icon to be tinted with `iconColor` and `selectedIconColor`.
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
  xcasset?: string | { default?: string; selected: string };
}

export interface DrawableIcon {
  /**
   * The name of the drawable resource to use as an icon.
   *
   * The value can be provided in two ways:
   * - As a string with the drawable resource name
   * - As an object specifying the default and selected states
   *
   * @example
   * ```tsx
   * <Icon drawable="ic_home" />
   * ```
   *
   * @example
   * ```tsx
   * <Icon drawable={{ default: 'ic_home_outline', selected: 'ic_home_filled' }} />
   * ```
   *
   * @platform android
   */
  drawable?: string | { default?: string; selected: string };
}

/**
 * Material icon name for Android native tabs.
 *
 * @platform android
 */
export interface MaterialIcon {
  /**
   * Material icon glyph name. See the [Material icons for the complete catalog](https://fonts.google.com/icons).
   *
   * The value can be provided in two ways:
   * - As a string with the Material icon name
   * - As an object specifying the default and selected states
   *
   * @example
   * ```tsx
   * <Icon md="home" />
   * ```
   *
   * @example
   * ```tsx
   * <Icon md={{ default: 'home', selected: 'home_filled' }} />
   * ```
   */
  md: AndroidSymbol | { default?: AndroidSymbol; selected: AndroidSymbol };
}

export type NativeTabsTriggerIconProps = {
  selectedColor?: ColorValue;
  /**
   * Controls how the `src`, `sf`, `drawable`, or `md` icon is drawn.
   *
   * - `'template'`: The icon is drawn in the tab's icon color. SF Symbols use the monochrome rendering.
   * - `'original'`: The icon keeps its own colors. SF Symbols use the multicolor rendering.
   *
   * The value can be a single mode, or an object with a distinct mode for the selected state.
   *
   * When not set, iOS uses `'template'` for a `src` icon in a state with an icon color, and Android tints the icon.
   *
   * @example
   * ```tsx
   * <Icon src={require('./path/to/icon.png')} renderingMode={{ default: 'template', selected: 'original' }} />
   * ```
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uiimage/renderingmode-swift.enum) for more information.
   */
  renderingMode?: IconRenderingMode | { default?: IconRenderingMode; selected: IconRenderingMode };
} & (
  | (SFSymbolIcon & DrawableIcon)
  | (SFSymbolIcon & MaterialIcon)
  | (SFSymbolIcon & SrcIcon)
  | (XcassetIcon & DrawableIcon)
  | (XcassetIcon & MaterialIcon)
  | (XcassetIcon & SrcIcon)
  | (MaterialIcon & SrcIcon)
  | (DrawableIcon & SrcIcon)
  | SrcIcon
);

/**
 * Renders an icon for the tab.
 *
 * Accepts various icon sources such as SF Symbols, xcasset images, drawable resources, material icons, or image sources.
 *
 * Each icon prop (`sf`, `xcasset`, `drawable`, `md`, `src`) can be either a single value, or an object
 * with `{ default, selected }` to use a distinct icon when the tab is selected.
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
export const NativeTabsTriggerIcon: React.FC<NativeTabsTriggerIconProps> = Icon;

/**
 * Helper component which can be used to load vector icons for `NativeTabs`.
 *
 * @example
 * ```tsx
 * import { NativeTabs } from 'expo-router/native-tabs';
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

export interface NativeTabsTriggerPromiseIconProps {
  loader: () => Promise<ImageSourcePropType | null>;
}

export const NativeTabsTriggerPromiseIcon = function NativeTabsTriggerPromiseIcon(
  props: NativeTabsTriggerPromiseIconProps
) {
  return null;
};

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

export const NativeTabsTriggerBadge: React.FC<NativeTabsTriggerBadgeProps> = Badge;

export interface NativeTabsBottomAccessoryProps {
  children?: React.ReactNode;
}

/**
 * A [bottom accessory](https://developer.apple.com/documentation/uikit/uitabbarcontroller/bottomaccessory) for `NativeTabs` on iOS 26 and above.
 *
 * @example
 * ```tsx
 * import { NativeTabs } from 'expo-router/native-tabs';
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
export const NativeTabsBottomAccessory: React.FC<NativeTabsBottomAccessoryProps> = () => {
  return null;
};
