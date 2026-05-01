import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { UniversalBaseProps } from '../types';

/**
 * A platform-specific icon definition.
 *
 * Pass a primitive (`require()`'d XML asset on Android, `string` SF Symbol on
 * iOS) or use [`Icon.select`](#iconselect) for a cross-platform definition.
 *
 * The plain object form (`{ ios, android }`) is also accepted but does not
 * tree-shake — the Android bundle still includes the iOS asset and vice versa.
 * Prefer `Icon.select` so the `babel-preset-expo` plugin can rewrite the call
 * into a `Platform.OS` ternary that Metro DCE can fold per platform.
 */
export type IconName =
  | SFSymbol
  | ImageSourcePropType
  | { ios: SFSymbol; android: ImageSourcePropType };

/**
 * Props for the [`Icon`](#icon) component.
 */
export interface IconProps extends UniversalBaseProps {
  /**
   * Icon source. Android expects an XML vector drawable asset (typically from
   * `@expo/material-symbols`); iOS expects an SF Symbol string.
   *
   * Use [`Icon.select`](#iconselect) for a cross-platform definition.
   */
  name: IconName;

  /**
   * Icon size in dp (Android) / points (iOS). When omitted, the icon uses its
   * intrinsic size.
   */
  size?: number;

  /**
   * Tint color applied to the icon.
   */
  color?: ColorValue;

  /**
   * Accessibility label for screen readers. On Android, maps to
   * `contentDescription`. iOS accessibility is not yet wired up.
   * @platform android
   */
  accessibilityLabel?: string;
}

/**
 * Argument shape accepted by [`Icon.select`](#iconselect).
 *
 * The `android` slot accepts either a synchronous `require()` result or a
 * dynamic `import('*.xml')` expression. The latter is preferred because
 * TypeScript validates the literal path through the package's `exports` map,
 * catching typos at compile time. The accompanying Babel plugin
 * (`@expo/ui/babel-plugin`, auto-loaded by `babel-preset-expo`) rewrites the
 * `import()` to a `require()` so Metro can still tree-shake the unused side.
 */
export interface IconSelectSpec {
  ios: SFSymbol;
  android: ImageSourcePropType | Promise<{ default: ImageSourcePropType }>;
}
