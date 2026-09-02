// @ref llp/0004-smart-start-and-project-state.rfc.md §Sub-features
// "Can this project run in Expo Go?" — answered from files only, with a reason per finding.
//
// Expo Go ships a fixed native runtime. A project can use it only when every native module it
// needs is already inside that runtime (`expo/bundledNativeModules.json`), no config plugin
// changes the native projects, and no native project is checked in.
import { readStaticAppConfigAsync } from './appConfig';
import { debugEvent } from './events';
import {
  describeNativeCode,
  hasNativeCode,
  inspectPackageAsync,
  readProjectNativeDirsAsync,
} from './nativeCode';
import {
  listDependencyNames,
  loadBundledNativeModulesAsync,
  readProjectPackageJsonAsync,
  readSdkVersionAsync,
  resolvePackageRootAsync,
} from './nodeModules';
import type { ExpoGoCompatibility, ExpoGoIncompatibility } from './types';

/**
 * Packages that are part of the Expo Go runtime itself, so their native code is always present.
 * They carry native code but are not listed in `bundledNativeModules.json`.
 */
const RUNTIME_PACKAGES = new Set(['expo']);

/**
 * Check whether a project can run in Expo Go, and why not.
 *
 * Never throws: an unreadable project yields an `unknown-sdk` reason instead of an error, so the
 * probe of {@link import('./probe').probeProjectStateAsync} always returns a full state.
 */
export async function checkExpoGoCompatibilityAsync(
  projectRoot: string
): Promise<ExpoGoCompatibility> {
  const [sdkVersion, bundledNativeModules, packageJson, appConfig, nativeDirs] = await Promise.all([
    readSdkVersionAsync(projectRoot),
    loadBundledNativeModulesAsync(projectRoot),
    readProjectPackageJsonAsync(projectRoot),
    readStaticAppConfigAsync(projectRoot),
    readProjectNativeDirsAsync(projectRoot),
  ]);

  const reasons: ExpoGoIncompatibility[] = [];

  if (sdkVersion == null || bundledNativeModules == null) {
    reasons.push({
      kind: 'unknown-sdk',
      detail:
        sdkVersion == null
          ? `The project has no installed "expo" package, so the SDK version and its Expo Go runtime are unknown. Install the project dependencies and check again.`
          : `The installed expo@${sdkVersion} package ships no bundledNativeModules.json, so the modules of its Expo Go runtime are unknown.`,
    });
  }

  const bareDirs = [nativeDirs.ios && 'ios', nativeDirs.android && 'android'].filter(Boolean);
  if (bareDirs.length) {
    reasons.push({
      kind: 'custom-native-code',
      detail: `The project has checked-in native directories (${bareDirs.join(', ')}), which can contain native code that the Expo Go runtime does not have.`,
    });
  }

  for (const packageName of listDependencyNames(packageJson)) {
    if (RUNTIME_PACKAGES.has(packageName) || bundledNativeModules?.[packageName]) {
      continue;
    }
    const packageRoot = await resolvePackageRootAsync(projectRoot, packageName);
    if (!packageRoot) {
      // A declared but uninstalled package says nothing about how the app runs today.
      continue;
    }
    const signals = await inspectPackageAsync(packageRoot);
    if (!hasNativeCode(signals)) {
      continue;
    }
    reasons.push({
      kind: 'unbundled-native-module',
      packageName,
      detail: `${packageName} contains native code (${describeNativeCode(signals).join(', ')}) and is not bundled in the Expo Go runtime${sdkVersion ? ` of SDK ${sdkVersion}` : ''}.`,
    });
  }

  if (appConfig.dynamic && !appConfig.source) {
    // A dynamic-only config is not evaluated here, so its plugins stay unknown.
    debugEvent('config_plugins_unknown', { reason: 'dynamic-app-config' });
  }
  for (const plugin of appConfig.plugins) {
    // A plugin of a bundled module is accepted: its module is inside the Expo Go runtime. This
    // is deliberately optimistic — a plugin like `expo-build-properties` still changes the
    // native projects, and those changes are absent from Expo Go.
    if (plugin.packageName && bundledNativeModules?.[plugin.packageName]) {
      continue;
    }
    reasons.push({
      kind: 'config-plugin',
      ...(plugin.packageName ? { packageName: plugin.packageName } : null),
      detail: plugin.packageName
        ? `The config plugin "${plugin.id}" comes from ${plugin.packageName}, which is not bundled in the Expo Go runtime, so its native changes are missing there.`
        : `The config plugin "${plugin.id}" is a file in the project, so its native changes only exist in a build you make yourself.`,
    });
  }

  return { compatible: reasons.length === 0, reasons };
}
