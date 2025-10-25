import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for the window tint color plugin
 */
export type WindowTintColorProps = {
  /**
   * Hex color string for the window tint color (e.g., "#FF6C1A")
   */
  windowTintColor?: string;
};

/**
 * RGB color values normalized to 0-1 range for UIColor
 */
type RgbColor = {
  r: number;
  g: number;
  b: number;
};

/**
 * Converts hex color to RGB values for UIColor
 * @param hex - Hex color string (e.g., "#FF6C1A" or "FF6C1A")
 * @returns RGB values normalized to 0-1
 * @throws Error if hex format is invalid
 */
function hexToRgb(hex: string): RgbColor {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    throw new Error(
      `Invalid hex color: ${hex}. Must be in format #RRGGBB or RRGGBB`
    );
  }

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Expo config plugin to set iOS window.tintColor from app.json
 *
 * This plugin injects window.tintColor into AppDelegate.swift during prebuild.
 * It works around an iOS 26 bug where iPad's inline tab bar layout ignores
 * per-item UITabBarItemAppearance tint colors.
 *
 * @example
 * ```json
 * {
 *   "expo": {
 *     "ios": {
 *       "windowTintColor": "#FF6C1A"
 *     },
 *     "plugins": [
 *       "expo-window-tint-color"
 *     ]
 *   }
 * }
 * ```
 *
 * @example
 * ```json
 * {
 *   "plugins": [
 *     ["expo-window-tint-color", { "windowTintColor": "#FF6C1A" }]
 *   ]
 * }
 * ```
 *
 * @example
 * ```json
 * {
 *   "plugins": [
 *     ["expo-window-tint-color", "#FF6C1A"]
 *   ]
 * }
 * ```
 */
const withWindowTintColor: ConfigPlugin<WindowTintColorProps | string | void> = (
  config,
  props
) => {
  // Determine window tint color from props or config
  let windowTintColor: string | undefined;

  if (typeof props === 'string') {
    windowTintColor = props;
  } else if (props && typeof props === 'object' && props.windowTintColor) {
    windowTintColor = props.windowTintColor;
  } else if (config.ios && 'windowTintColor' in config.ios) {
    windowTintColor = (config.ios as any).windowTintColor;
  }

  if (!windowTintColor) {
    console.warn(
      '[expo-window-tint-color] No window tint color specified. ' +
        'Provide via plugin props or ios.windowTintColor in app.json'
    );
    return config;
  }

  console.log(
    `[expo-window-tint-color] Setting window.tintColor to ${windowTintColor}`
  );

  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegatePath = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName || 'App',
        'AppDelegate.swift'
      );

      // Check if AppDelegate.swift exists
      if (!fs.existsSync(appDelegatePath)) {
        console.warn(
          `[expo-window-tint-color] AppDelegate.swift not found at ${appDelegatePath}. ` +
            'Skipping window.tintColor injection.'
        );
        return config;
      }

      let contents = fs.readFileSync(appDelegatePath, 'utf-8');

      // Check if window.tintColor is already set
      if (contents.includes('window.tintColor')) {
        console.log(
          '[expo-window-tint-color] window.tintColor already set, updating color...'
        );

        // Replace existing tintColor with new one
        const { r, g, b } = hexToRgb(windowTintColor);
        const newColorLine = `      window.tintColor = UIColor(red: ${r}, green: ${g}, blue: ${b}, alpha: 1.0) // ${windowTintColor}`;

        contents = contents.replace(
          /window\.tintColor = UIColor\(red: [\d.]+, green: [\d.]+, blue: [\d.]+, alpha: [\d.]+\)[^)]*(?:\/\/[^\n]*)?/,
          newColorLine.trim()
        );
      } else {
        // Inject new window.tintColor code
        const { r, g, b } = hexToRgb(windowTintColor);

        // Code to inject
        const tintColorCode = `
    // Set global tint color (injected by expo-window-tint-color plugin)
    // This works around iOS 26 bug where inline tab bar layout ignores per-item tint colors
    if let window = window {
      window.tintColor = UIColor(red: ${r}, green: ${g}, blue: ${b}, alpha: 1.0) // ${windowTintColor}
    }
`;

        // Find the window creation line and inject after it
        const windowCreationPattern =
          /(window = UIWindow\(frame: UIScreen\.main\.bounds\))/;

        if (!windowCreationPattern.test(contents)) {
          console.warn(
            '[expo-window-tint-color] Could not find window creation line in AppDelegate.swift. ' +
              'Skipping injection.'
          );
          return config;
        }

        contents = contents.replace(windowCreationPattern, `$1\n${tintColorCode}`);

        console.log('[expo-window-tint-color] Successfully injected window.tintColor code');
      }

      // Write modified contents back
      fs.writeFileSync(appDelegatePath, contents, 'utf-8');

      return config;
    },
  ]);
};

export default withWindowTintColor;
