import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { NativeTabsLabelStyle } from '../NativeBottomTabs/types';

export interface LabelProps {
  /**
   * The text to display as the label for the tab.
   */
  children?: string;
  selectedStyle?: NativeTabsLabelStyle;
  /**
   * If true, the label will be hidden.
   * @default false
   */
  hidden?: boolean;
}

export function Label(props: LabelProps) {
  return null;
}

export interface SourceIconCombination {
  /**
   * The image source to use as an icon.
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
  drawable?: never;
  sf?: never;
}

export interface NamedIconCombination {
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
  /**
   * The name of the drawable resource to use as an icon.
   * @platform android
   */
  drawable?: string;
  src?: never;
}

export type IconProps = { selectedColor?: ColorValue } & (
  | NamedIconCombination
  | SourceIconCombination
);

/**
 * Renders an icon for the tab.
 *
 * @platform ios
 * @platform android
 */
export function Icon(props: IconProps) {
  return null;
}

export interface VectorIconProps<NameT extends string> {
  /**
   * The family of the vector icon.
   *
   * @example
   * ```tsx
   * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
   * ```
   */
  family: {
    getImageSource: (name: NameT, size: number, color: ColorValue) => Promise<ImageSourcePropType>;
  };
  /**
   * The name of the vector icon.
   */
  name: NameT;
}

/**
 * Helper component which can be used to load vector icons for `NativeTabs`.
 *
 * @example
 * ```tsx
 * import { NativeTabs, VectorIcon } from 'expo-router';
 * import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
 *
 * export default Layout(){
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.Trigger name="index">
 *         <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />
 *       </NativeTabs.Trigger>
 *     </NativeTabs>
 *   );
 * }
 * ```
 */
export function VectorIcon<NameT extends string>(props: VectorIconProps<NameT>) {
  return null;
}

export interface BadgeProps {
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

export function Badge(props: BadgeProps) {
  return null;
}
