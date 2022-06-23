import chalk from 'chalk';

import { ModPlatform } from '../Plugin.types';

/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » android: android.package: property is invalid https://expo.fyi/android-package
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
export function addWarningAndroid(property: string, text: string, link?: string) {
  console.warn(formatWarning('android', property, text, link));
}

/**
 * Log a warning that doesn't disrupt the spinners.
 *
 * ```sh
 * » ios: ios.bundleIdentifier: property is invalid https://expo.fyi/bundle-identifier
 * ```
 *
 * @param property Name of the config property that triggered the warning (best-effort)
 * @param text Main warning message
 * @param link Useful link to resources related to the warning
 */
export function addWarningIOS(property: string, text: string, link?: string) {
  console.warn(formatWarning('ios', property, text, link));
}

export function addWarningForPlatform(
  platform: ModPlatform,
  property: string,
  text: string,
  link?: string
) {
  console.warn(formatWarning(platform, property, text, link));
}

function formatWarning(platform: string, property: string, warning: string, link?: string) {
  return chalk.yellow`${'» ' + chalk.bold(platform)}: ${property}: ${warning}${
    link ? chalk.gray(' ' + link) : ''
  }`;
}
