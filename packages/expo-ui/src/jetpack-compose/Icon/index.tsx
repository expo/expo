import { requireNativeView } from 'expo';
import {
  type ColorValue,
  type ImageSourcePropType,
  type ImageResolvedAssetSource,
  Image,
} from 'react-native';

import type { ModifierConfig } from '../../types';
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
   * The tint color to apply to the icon. Accepts hex strings, named colors,
   * or RGB arrays.
   *
   * - When omitted, the icon inherits the color from the surrounding
   *   `LocalContentColor` (e.g. the toolbar/FAB content color).
   * - When set to `null`, no tint is applied — the icon is drawn with its
   *   original colors (`Color.Unspecified`). Use this for multicolored icons.
   *
   * @example
   * ```tsx
   * <Icon source={require('./assets/star.xml')} tint="#007AFF" />
   * <Icon source={require('./assets/star.xml')} tint="blue" />
   * <Icon source={require('./assets/multicolor.xml')} tint={null} />
   * ```
   */
  tint?: ColorValue | null;

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
  modifiers?: ModifierConfig[];
};

/**
 * @hidden
 */
export type NativeIconProps = Omit<IconProps, 'source' | 'tint'> & {
  source: ImageResolvedAssetSource;
  tint?: ColorValue;
  inheritTint: boolean;
};

const IconNativeView: React.ComponentType<NativeIconProps> = requireNativeView(
  'ExpoUI',
  'IconView'
);

function transformIconProps(props: IconProps): NativeIconProps {
  const { source, modifiers, tint, ...restProps } = props;
  // Differentiate "tint not provided" (inherit `LocalContentColor`) from
  // "tint explicitly null" (no tint, draw original colors).
  const tintIsExplicitlyNull = 'tint' in props && tint === null;

  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    tint: tint ?? undefined,
    inheritTint: !tintIsExplicitlyNull,
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
 *   tint="#007AFF"
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
