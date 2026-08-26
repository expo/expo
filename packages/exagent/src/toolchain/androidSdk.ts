// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// Where the Android SDK is, as one answer two callers share.
//
// `src/toolchain/detect.ts` asks so it can say whether this machine can build; `src/navigate/
// device.ts` asks so it can find `adb` when `PATH` has not got it. Two copies of "which directory
// is the SDK" would be two chances to disagree about the same machine, and the second caller only
// exists because the first already knows the answer.

import fs from 'fs';
import os from 'os';
import path from 'path';

/** Environment variables the Android tooling reads, in the order it reads them. */
export const ANDROID_SDK_ENV_VARS = ['ANDROID_HOME', 'ANDROID_SDK_ROOT'] as const;

/** The SDK an environment variable names, if one does and the directory is there. */
export interface NamedAndroidSdk {
  /** Which variable named it. */
  name: (typeof ANDROID_SDK_ENV_VARS)[number];
  value: string;
}

/** The environment variable that names an SDK, whether or not the directory exists. */
export function namedAndroidSdk(): NamedAndroidSdk | null {
  for (const name of ANDROID_SDK_ENV_VARS) {
    const value = process.env[name];
    if (value && value.trim()) {
      return { name, value: value.trim() };
    }
  }
  return null;
}

/** Where the Android Studio installer puts the SDK, per host. */
export function defaultAndroidSdkDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Android', 'sdk');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'),
      'Android',
      'Sdk'
    );
  }
  return path.join(home, 'Android', 'Sdk');
}

/**
 * The Android SDK directory of this machine, or null when there is none.
 *
 * The named location wins over the default one, exactly as the Android tooling resolves it, and a
 * name that points at nothing is null rather than a path a caller would go on to build on.
 */
export function androidSdkDir(): string | null {
  const dir = namedAndroidSdk()?.value ?? defaultAndroidSdkDir();
  return directoryExistsSync(dir) ? dir : null;
}

export function directoryExistsSync(dir: string): boolean {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}
