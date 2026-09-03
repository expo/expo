// @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
// Which apps a simulator has, for a simulator that is not running.
//
// **Why this is a filesystem reader and not a `simctl` call.** Both of the tools that answer this
// question — `simctl listapps` and `simctl get_app_container` — refuse on a device that is not
// booted: `Unable to lookup in current state: Shutdown` [observed — 2026-08-30, Xcode 26, on both].
// Every device this has to ask about is shut, because the whole point of asking is to decide which
// one to *boot*, so the tools can only answer the question nobody needs.
//
// What is left is the layout on disk, which is stable and public: an installed app is
// `Devices/<udid>/data/Containers/Bundle/Application/<container-uuid>/<Name>.app`, and the app's
// own `Info.plist` inside it carries `CFBundleIdentifier`. The container uuid is the *container's*
// and the directory name is the app's display name, so neither says which app it is and every
// bundle has to be looked into.
//
// `plutil` does the reading rather than a plist parser here, for the reason llp/0001 constraint 5
// gives about the Expo CLI: the format is Apple's, the tool that reads it ships with the OS, and a
// parser of our own would be a second reading of a format we do not own.

import fs from 'fs';
import os from 'os';
import path from 'path';

import { spawnCaptureAsync } from '../utils/spawnCapture';

/** How long `plutil` gets to read one `Info.plist`. Generous: it reads a file and exits. */
const PLUTIL_TIMEOUT_MS = 10_000;

/** The directory CoreSimulator keeps one simulator's whole state in. */
export function simulatorDeviceDir(
  udid: string,
  { homedir = os.homedir() }: { homedir?: string } = {}
): string {
  return path.join(homedir, 'Library', 'Developer', 'CoreSimulator', 'Devices', udid);
}

/**
 * Whether this machine has a simulator with this udid at all, as a directory on disk.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
 *
 * The distinction {@link readInstalledAppIdsAsync} deliberately does not draw. That function
 * answers "no apps" for a device it could not read, and for the boot choice the two are the same
 * answer: do not boot this one. For a caller that **acts** on the absence — the install phase,
 * whose action is a 423 MB download — they are opposite, so it has to be able to tell whether the
 * disk was there to read.
 *
 * Found by CI rather than by reasoning: the e2e tier runs on Linux, where there is no
 * CoreSimulator tree and no `plutil`, so every fake udid in it read as "Expo Go is not installed"
 * and the install reached for a real download [observed — tier0-linux, 2026-09-03].
 */
export async function simulatorDiskExistsAsync(
  udid: string,
  { homedir }: { homedir?: string } = {}
): Promise<boolean> {
  try {
    return (await fs.promises.stat(simulatorDeviceDir(udid, { homedir }))).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Every installed app's `.app` bundle on one simulator.
 *
 * Never throws. A device with no `data` directory has never been booted and therefore has no apps,
 * which is an answer rather than an error — and it is the answer that matters most here, because a
 * device with no apps is exactly the one a run must not boot.
 */
export function appBundleDirs(
  deviceDir: string,
  { readdir = (dir: string) => fs.readdirSync(dir) }: { readdir?: (dir: string) => string[] } = {}
): string[] {
  const root = path.join(deviceDir, 'data', 'Containers', 'Bundle', 'Application');
  let containers: string[];
  try {
    containers = readdir(root);
  } catch {
    return [];
  }

  const bundles: string[] = [];
  for (const container of containers) {
    // `.DS_Store` and anything else that is not a container directory answers nothing.
    let entries: string[];
    try {
      entries = readdir(path.join(root, container));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.endsWith('.app')) {
        bundles.push(path.join(root, container, entry));
      }
    }
  }
  return bundles;
}

/** One bundle's `CFBundleIdentifier`, or null when it could not be read. */
export async function readBundleIdAsync(appBundleDir: string): Promise<string | null> {
  const result = await spawnCaptureAsync(
    'plutil',
    ['-extract', 'CFBundleIdentifier', 'raw', '-o', '-', path.join(appBundleDir, 'Info.plist')],
    { timeoutMs: PLUTIL_TIMEOUT_MS }
  );
  if (result.spawnError || result.exitCode !== 0) {
    return null;
  }
  const id = result.stdout.trim();
  return id || null;
}

export interface ReadInstalledAppIdsOptions {
  homedir?: string;
  /** Injected for the tests, so the layout can be pinned without a simulator. */
  bundleDirs?: (deviceDir: string) => string[];
  readBundleIdAsync?: (appBundleDir: string) => Promise<string | null>;
}

/**
 * The application ids installed on one simulator, booted or not.
 *
 * Never throws and never reports a partial read as an empty device: a bundle whose `Info.plist`
 * will not parse is one app this could not place, and the others are still evidence.
 */
export async function readInstalledAppIdsAsync(
  udid: string,
  {
    homedir,
    bundleDirs = (deviceDir) => appBundleDirs(deviceDir),
    readBundleIdAsync: readId = readBundleIdAsync,
  }: ReadInstalledAppIdsOptions = {}
): Promise<string[]> {
  const bundles = bundleDirs(simulatorDeviceDir(udid, { homedir }));
  const ids = await Promise.all(bundles.map((bundle) => readId(bundle)));
  return ids.filter((id): id is string => id != null);
}

/**
 * Whether one simulator has one app, booted or not.
 *
 * The question the device choice is made on (`./bootDevice.ts`), kept as its own function so the
 * answer is one thing rather than a filter written twice.
 */
export async function simulatorHasAppAsync(
  udid: string,
  appId: string,
  options: ReadInstalledAppIdsOptions = {}
): Promise<boolean> {
  return (await readInstalledAppIdsAsync(udid, options)).includes(appId);
}
