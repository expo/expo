import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

interface LabelProps {
  /**
   * The text to display as the label for the tab.
   */
  children?: string;
}

export function Label(props: LabelProps) {
  return null;
}

interface SourceIconProps {
  /**
   * The image source to use as an icon.
   * @platform iOS
   */
  src?: ImageSourcePropType;
  /**
   * The image source to use as an icon when the tab is selected.
   * @platform iOS
   */
  selectedSrc?: ImageSourcePropType;
  // TODO: Remove this when custom icons can be used on Android
  /**
   * The name of the drawable resource to use as an icon.
   * @platform android
   */
  drawable?: string;
  sf?: never;
  selectedSf?: never;
}

interface NamedIconProps {
  /**
   * The name of the SF Symbol to use as an icon.
   * @platform iOS
   */
  sf?: SFSymbol;
  /**
   * The name of the SF Symbol to use as an icon when the tab is selected.
   * @platform iOS
   */
  selectedSf?: SFSymbol;
  /**
   * The name of the drawable resource to use as an icon.
   * @platform android
   */
  drawable?: string;
  src?: never;
  selectedSrc?: never;
}

type IconProps = SourceIconProps | NamedIconProps;

export function Icon(props: IconProps) {
  return null;
}

interface BadgeProps {
  /**
   * The text to display as the badge for the tab.
   * If not provided, the badge will not be displayed.
   */
  children?: string;
}

export function Badge(props: BadgeProps) {
  return null;
}
