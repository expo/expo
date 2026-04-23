import { createContext, useContext } from 'react';
import {
  type ColorSchemeName,
  type ColorValue,
  useColorScheme as useRNColorScheme,
} from 'react-native';

import { ExpoUIModule } from './ExpoUIModule';

/**
 * 8-digit RGBA hex color string, always in `#RRGGBBAA` form (uppercase).
 * Compatible with React Native's `ColorValue`.
 */
export type RgbaHex = `#${string}`;

/**
 * Material 3 color palette exposed to TypeScript/JavaScript as `#RRGGBBAA` strings.
 *
 * On Android 12+ devices these values are derived from the app user's wallpaper
 * (Material You). On older devices they fall back to the static Material 3
 * baseline palette. Use [`isDynamicColorAvailable`](#materialcolorsisdynamiccoloravailable) to distinguish the
 * two at runtime.
 */
export type MaterialColors = {
  /** The primary color is the color displayed most frequently across your app's screens and components. */
  primary: RgbaHex;
  /** Color used for text and icons displayed on top of the primary color. */
  onPrimary: RgbaHex;
  /** The preferred tonal color of containers. */
  primaryContainer: RgbaHex;
  /** The color (and state variants) that should be used for content on top of `primaryContainer`. */
  onPrimaryContainer: RgbaHex;
  /** Color to be used as a "primary" color in places where the inverse color scheme is needed, such as the button on a SnackBar. */
  inversePrimary: RgbaHex;

  /**
   * The secondary color provides more ways to accent and distinguish your product. Secondary colors are best for:
   *
   * - Floating action buttons
   * - Selection controls, like checkboxes and radio buttons
   * - Highlighting selected text
   * - Links and headlines
   */
  secondary: RgbaHex;
  /** Color used for text and icons displayed on top of the secondary color. */
  onSecondary: RgbaHex;
  /** A tonal color to be used in containers. */
  secondaryContainer: RgbaHex;
  /** The color (and state variants) that should be used for content on top of `secondaryContainer`. */
  onSecondaryContainer: RgbaHex;

  /** The tertiary color that can be used to balance primary and secondary colors, or bring heightened attention to an element such as an input field. */
  tertiary: RgbaHex;
  /** Color used for text and icons displayed on top of the tertiary color. */
  onTertiary: RgbaHex;
  /** A tonal color to be used in containers. */
  tertiaryContainer: RgbaHex;
  /** The color (and state variants) that should be used for content on top of `tertiaryContainer`. */
  onTertiaryContainer: RgbaHex;

  /** The background color that appears behind scrollable content. */
  background: RgbaHex;
  /** Color used for text and icons displayed on top of the background color. */
  onBackground: RgbaHex;

  /** The surface color that affect surfaces of components, such as cards, sheets, and menus. */
  surface: RgbaHex;
  /** Color used for text and icons displayed on top of the surface color. */
  onSurface: RgbaHex;
  /** Another option for a color with similar uses of `surface`. */
  surfaceVariant: RgbaHex;
  /** The color (and state variants) that can be used for content on top of `surface`. */
  onSurfaceVariant: RgbaHex;
  /** This color will be used by components that apply tonal elevation and is applied on top of `surface`. The higher the elevation the more this color is used. */
  surfaceTint: RgbaHex;
  /** A color that contrasts sharply with `surface`. Useful for surfaces that sit on top of other surfaces with surface color. */
  inverseSurface: RgbaHex;
  /** A color that contrasts well with `inverseSurface`. Useful for content that sits on top of containers that are `inverseSurface`. */
  inverseOnSurface: RgbaHex;

  /** The error color is used to indicate errors in components, such as invalid text in a text field. */
  error: RgbaHex;
  /** Color used for text and icons displayed on top of the error color. */
  onError: RgbaHex;
  /** The preferred tonal color of error containers. */
  errorContainer: RgbaHex;
  /** The color (and state variants) that should be used for content on top of `errorContainer`. */
  onErrorContainer: RgbaHex;

  /** Subtle color used for boundaries. Outline color role adds contrast for accessibility purposes. */
  outline: RgbaHex;
  /** Utility color used for boundaries for decorative elements when strong contrast is not required. */
  outlineVariant: RgbaHex;

  /** Color of a scrim that obscures content. */
  scrim: RgbaHex;

  /** A surface variant that is always brighter than `surface`, whether in light or dark mode. */
  surfaceBright: RgbaHex;
  /** A surface variant that is always dimmer than `surface`, whether in light or dark mode. */
  surfaceDim: RgbaHex;
  /** A surface variant that affects containers of components, such as cards, sheets, and menus. */
  surfaceContainer: RgbaHex;
  /** A surface variant for containers with higher emphasis than `surfaceContainer`. Use this role for content which requires more emphasis than `surfaceContainer`. */
  surfaceContainerHigh: RgbaHex;
  /** A surface variant for containers with higher emphasis than `surfaceContainerHigh`. Use this role for content which requires more emphasis than `surfaceContainerHigh`. */
  surfaceContainerHighest: RgbaHex;
  /** A surface variant for containers with lower emphasis than `surfaceContainer`. Use this role for content which requires less emphasis than `surfaceContainer`. */
  surfaceContainerLow: RgbaHex;
  /** A surface variant for containers with lower emphasis than `surfaceContainerLow`. Use this role for content which requires less emphasis than `surfaceContainerLow`. */
  surfaceContainerLowest: RgbaHex;

  /** A primary variant that maintains the same tone in light and dark themes. The fixed color role may be used instead of the equivalent container role in situations where such fixed behavior is desired. */
  primaryFixed: RgbaHex;
  /** A primary variant that maintains the same tone in light and dark themes. Dim roles provide a stronger, more emphasized tone relative to the equivalent fixed color. */
  primaryFixedDim: RgbaHex;
  /** Color used for text and icons displayed on top of `primaryFixed` or `primaryFixedDim`. Maintains the same tone in light and dark themes. */
  onPrimaryFixed: RgbaHex;
  /** An `onPrimaryFixed` variant which provides less emphasis. Useful when a strong contrast is not required. */
  onPrimaryFixedVariant: RgbaHex;

  /** A secondary variant that maintains the same tone in light and dark themes. The fixed color role may be used instead of the equivalent container role in situations where such fixed behavior is desired. */
  secondaryFixed: RgbaHex;
  /** A secondary variant that maintains the same tone in light and dark themes. Dim roles provide a stronger, more emphasized tone relative to the equivalent fixed color. */
  secondaryFixedDim: RgbaHex;
  /** Color used for text and icons displayed on top of `secondaryFixed` or `secondaryFixedDim`. Maintains the same tone in light and dark themes. */
  onSecondaryFixed: RgbaHex;
  /** An `onSecondaryFixed` variant which provides less emphasis. Useful when a strong contrast is not required. */
  onSecondaryFixedVariant: RgbaHex;

  /** A tertiary variant that maintains the same tone in light and dark themes. The fixed color role may be used instead of the equivalent container role in situations where such fixed behavior is desired. */
  tertiaryFixed: RgbaHex;
  /** A tertiary variant that maintains the same tone in light and dark themes. Dim roles provide a stronger, more emphasized tone relative to the equivalent fixed color. */
  tertiaryFixedDim: RgbaHex;
  /** Color used for text and icons displayed on top of `tertiaryFixed` or `tertiaryFixedDim`. Maintains the same tone in light and dark themes. */
  onTertiaryFixed: RgbaHex;
  /** An `onTertiaryFixed` variant which provides less emphasis. Useful when a strong contrast is not required. */
  onTertiaryFixedVariant: RgbaHex;
};

/**
 * Options common to [`getMaterialColors`](#materialcolorsgetmaterialcolorsoptions) and [`useMaterialColors`](#usematerialcolorsoptions).
 */
export type MaterialColorsOptions = {
  /**
   * Force a specific appearance. When omitted, the palette follows the
   * current system dark/light mode.
   */
  scheme?: 'light' | 'dark';
  /**
   * Seed color used to generate the full Material 3 palette via the
   * `SchemeTonalSpot` variant (the same one Material You uses). When set,
   * the palette is derived from this color on every Android device, including
   * those below Android 12 where wallpaper-based dynamic colors are not
   * available. When omitted, the palette comes from the device wallpaper
   * (Android 12+) or the static Material 3 baseline.
   */
  seedColor?: ColorValue;
};

/**
 * Options for [`useMaterialColors`](#usematerialcolorsoptions).
 */
export type UseMaterialColorsOptions = Omit<MaterialColorsOptions, 'scheme'> & {
  /**
   * `'light'` or `'dark'` force a specific palette. `'unspecified'`, `null`,
   * or omitted follows the system appearance.
   */
  colorScheme?: ColorSchemeName;
};

/**
 * Whether the current device supports Material You dynamic colors (Android
 * 12+). When `false`, [`getMaterialColors`](#materialcolorsgetmaterialcolorsoptions) and [`useMaterialColors`](#usematerialcolorsoptions)
 * return the static Material 3 baseline palette unless a `seedColor` is
 * provided — seed-based palettes work on every Android API level.
 */
export const isDynamicColorAvailable: boolean = ExpoUIModule.isDynamicColorAvailable ?? false;

/**
 * React context to cache the palette within a Host subtree.
 * @hidden
 */
export const HostPaletteContext = createContext<MaterialColors | null>(null);

/**
 * Get the Material 3 color palette.
 */
export function getMaterialColors(options?: MaterialColorsOptions): MaterialColors {
  return ExpoUIModule.getMaterialColors(options ?? null);
}

/**
 * Returns the Material 3 color palette.
 * Call with no arguments inside a `<Host>` to get the palette that `<Host>` is themed with.
 * Pass `scheme` and/or `seedColor` to get a specific palette.
 */
export function useMaterialColors(options?: UseMaterialColorsOptions): MaterialColors {
  const hostPalette = useContext(HostPaletteContext);
  const systemScheme = useRNColorScheme();
  if (options == null && hostPalette != null) {
    // No options and reading the colors from Host context
    return hostPalette;
  }
  // If options are provided, resolve the colors from the native module.
  const { colorScheme, seedColor } = options ?? {};
  const resolvedScheme: 'light' | 'dark' =
    colorScheme === 'light' || colorScheme === 'dark'
      ? colorScheme
      : systemScheme === 'dark'
        ? 'dark'
        : 'light';
  return getMaterialColors({ scheme: resolvedScheme, seedColor });
}
