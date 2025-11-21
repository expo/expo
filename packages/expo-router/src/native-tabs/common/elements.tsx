import type { ColorValue, ImageSourcePropType, StyleProp } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Label, Icon, Badge, VectorIcon } from '../../primitives';
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

export interface DrawableIcon {
  /**
   * The name of the drawable resource to use as an icon.
   * @platform android
   */
  drawable?: string;
}

export type BaseNativeTabsTriggerIconProps = { selectedColor?: ColorValue };

export type NativeTabsTriggerIconProps = BaseNativeTabsTriggerIconProps &
  ((SFSymbolIcon & DrawableIcon) | (SFSymbolIcon & SrcIcon) | (DrawableIcon & SrcIcon) | SrcIcon);

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
export const NativeTabsTriggerIcon: React.FC<NativeTabsTriggerIconProps> = Icon;

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
