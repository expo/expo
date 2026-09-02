// @ref llp/0004-smart-start-and-project-state.rfc.md
// Detecting native code from files on disk, for both the Expo Go check and the post-install
// impact classifier. Autolinking would give a more precise answer, but it runs project code and
// needs the packages to be linkable; these signals only need a directory listing.
import fs from 'fs';
import path from 'path';

import { directoryExistsAsync } from '../utils/dir';

/** What a package's own files say about the native surface it adds. */
export interface PackageNativeSignals {
  /** An `ios/` directory. */
  ios: boolean;
  /** An `android/` directory. */
  android: boolean;
  /** An `expo-module.config.json`, so autolinking picks the package up as an Expo module. */
  expoModuleConfig: boolean;
  /** A `*.podspec`, how a React Native library ships iOS code without an `ios/` directory. */
  podspec: boolean;
  /** An `app.plugin.js`, the entry point convention for a config plugin. */
  appPlugin: boolean;
}

const EMPTY_SIGNALS: PackageNativeSignals = {
  ios: false,
  android: false,
  expoModuleConfig: false,
  podspec: false,
  appPlugin: false,
};

/** Read the native-code signals of an installed package from its top-level entries. */
export async function inspectPackageAsync(packageRoot: string): Promise<PackageNativeSignals> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(packageRoot, { withFileTypes: true });
  } catch {
    return { ...EMPTY_SIGNALS };
  }

  const signals = { ...EMPTY_SIGNALS };
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'ios') signals.ios = true;
      if (entry.name === 'android') signals.android = true;
    } else {
      if (entry.name === 'expo-module.config.json') signals.expoModuleConfig = true;
      if (entry.name === 'app.plugin.js') signals.appPlugin = true;
      if (entry.name.endsWith('.podspec')) signals.podspec = true;
    }
  }
  return signals;
}

/** Whether the package adds native code that a prebuilt runtime cannot contain. */
export function hasNativeCode(signals: PackageNativeSignals): boolean {
  return signals.ios || signals.android || signals.expoModuleConfig || signals.podspec;
}

/** One phrase per native-code signal, for the `reasons` of a report. */
export function describeNativeCode(signals: PackageNativeSignals): string[] {
  const reasons: string[] = [];
  if (signals.ios) reasons.push('ships an ios/ directory');
  if (signals.android) reasons.push('ships an android/ directory');
  if (signals.expoModuleConfig) reasons.push('ships an expo-module.config.json');
  if (signals.podspec) reasons.push('ships a podspec');
  return reasons;
}

/** Native projects checked into the repository, i.e. the project is bare instead of CNG. */
export async function readProjectNativeDirsAsync(
  projectRoot: string
): Promise<{ ios: boolean; android: boolean }> {
  const [ios, android] = await Promise.all([
    directoryExistsAsync(path.join(projectRoot, 'ios')),
    directoryExistsAsync(path.join(projectRoot, 'android')),
  ]);
  return { ios, android };
}
