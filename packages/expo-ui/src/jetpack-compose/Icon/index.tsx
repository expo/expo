import { requireNativeView } from 'expo';
import {
  type ColorValue,
  type ImageSourcePropType,
  type ImageResolvedAssetSource,
  Image,
} from 'react-native';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type IconProps = {
  /**
   * The source of the icon. Can be a URI string or the result of `require()`.
   * On Android, supports XML vector drawables loaded via Metro bundler.
   *
   * @example
   * ```tsx
   * <Icon source={require('./assets/home.xml')} />
   * <Icon source={{ uri: 'file:///path/to/icon.xml' }} />
   * ```
   */
  source: ImageSourcePropType;

  /**
   * The tint color to apply to the icon.
   * Accepts hex strings, named colors, or RGB arrays.
   *
   * @example
   * ```tsx
   * <Icon source={require('./assets/star.xml')} tintColor="#007AFF" />
   * <Icon source={require('./assets/star.xml')} tintColor="blue" />
   * ```
   */
  tintColor?: ColorValue;

  /**
   * The size of the icon in density-independent pixels (dp).
   * If not specified, the icon will use its intrinsic size.
   *
   * @example
   * ```tsx
   * <Icon source={require('./assets/settings.xml')} size={24} />
   * ```
   */
  size?: number;

  /**
   * Accessibility label for the icon.
   * Used by screen readers to describe the icon to users.
   *
   * @example
   * ```tsx
   * <Icon
   *   source={require('./assets/settings.xml')}
   *   contentDescription="Settings icon"
   * />
   * ```
   */
  contentDescription?: string;

  /**
   * Modifiers for the component.
   * Allows you to apply layout and styling modifiers to the icon.
   *
   * @example
   * ```tsx
   * <Icon
   *   source={require('./assets/icon.xml')}
   *   modifiers={[
   *     padding(8),
   *     background('lightgray')
   *   ]}
   * />
   * ```
   */
  modifiers?: ExpoModifier[];
};

/**
 * @hidden
 */
export type NativeIconProps = Omit<IconProps, 'source'> & {
  source: ImageResolvedAssetSource;
};

const IconNativeView: React.ComponentType<NativeIconProps> = requireNativeView(
  'ExpoUI',
  'IconView'
);

function transformIconProps(props: IconProps): NativeIconProps {
  const { source, modifiers, ...restProps } = props;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    source: Image.resolveAssetSource(source),
  };
}

/**
 * Displays an icon from an XML vector drawable or other image source.
 *
 * The Icon component renders vector graphics and images with support for
 * tinting, sizing, and accessibility features. On Android, it natively
 * supports XML vector drawables loaded via Metro bundler using `require()`.
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { Icon } from 'expo-ui';
 *
 * <Icon source={require('./assets/home.xml')} />
 * ```
 *
 * @example
 * With styling:
 * ```tsx
 * <Icon
 *   source={require('./assets/settings.xml')}
 *   size={24}
 *   tintColor="#007AFF"
 *   contentDescription="Settings icon"
 * />
 * ```
 *
 * @example
 * With modifiers:
 * ```tsx
 * <Icon
 *   source={require('./assets/star.xml')}
 *   size={32}
 *   modifiers={[
 *     padding(8),
 *     background('lightgray')
 *   ]}
 * />
 * ```
 */
export function Icon(props: IconProps) {
  return <IconNativeView {...transformIconProps(props)} />;
}
