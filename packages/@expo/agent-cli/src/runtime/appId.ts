// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
// Which application to act on, on a device.
//
// `navigate` never had to answer this: a deep link is addressed by URL scheme, and the app that
// claims the scheme is whichever one the device decides. `runtime:stop` and the device half of
// `runtime:reload` address a *process*, and a process is addressed by application id — so the
// question has to be answered exactly, and a wrong answer stops somebody else's app.
//
// The evidence is ranked the way `decideExpoGoTarget` ranks its own, strongest first, and every
// step says which one it used so a wrong stop is diagnosable from the report.

import fs from 'fs';
import path from 'path';

import type { NavigatePlatform } from '../navigate/device';
import { EXPO_GO_APP_IDS } from '../navigate/target';

/** Expo Go's application id, per platform, for a project that has no build of its own. */
export const EXPO_GO_APP_ID: Record<NavigatePlatform, string> = {
  ios: 'host.exp.Exponent',
  android: 'host.exp.exponent',
};

/** Static config files we can read without evaluating JavaScript. */
const STATIC_CONFIG_FILES = ['app.json', 'app.config.json'];

/**
 * The shape of an application id, and the reason it is checked here.
 *
 * An id reaches `adb shell`, which re-parses its words through a shell **on the device**
 * (`../navigate/deepLink` §quoteForDeviceShell), and on Windows it reaches `cmd.exe` through a
 * batch shim (`../utils/windowsShim`). Neither source of an id is this CLI's: `app.json` belongs to
 * a project that may have been cloned, and a `/json/list` entry is whatever answered the dev
 * server. This charset covers every real Android package and iOS bundle id and holds no shell
 * metacharacter, so a malformed id is refused before it becomes one.
 */
const APP_ID = /^[A-Za-z0-9._-]{1,255}$/;

/** Whether this is an application id at all, rather than something wearing the field. */
export function isValidAppId(value: string): boolean {
  return APP_ID.test(value);
}

export interface ResolvedAppId {
  appId: string;
  /** Which step produced it, and therefore how much it is worth. */
  source: 'flag' | 'dev-server' | 'app-config' | 'expo-go-default';
  /** One clause naming the evidence, for the report. */
  reason: string;
}

export interface ResolveAppIdInput {
  platform: NavigatePlatform;
  /** The `--app-id` the caller named, which they know better than this does. */
  appIdOverride?: string | null;
  /** Application ids the dev server reported for the apps attached to it. */
  targetAppIds: readonly string[];
  /** `ios.bundleIdentifier` / `android.package` from the project's static app config. */
  configured: string | null;
}

/**
 * Decide which application id to act on.
 *
 * The dev server outranks the app config on purpose: the config says what a *build* of this
 * project would be called, and the dev server says what is running right now. A project whose
 * config names a bundle identifier can still be running in Expo Go, and stopping the id from the
 * config would then stop nothing while reporting that it stopped something.
 */
export function resolveAppId({
  platform,
  appIdOverride,
  targetAppIds,
  configured,
}: ResolveAppIdInput): ResolvedAppId {
  if (appIdOverride) {
    return { appId: appIdOverride, source: 'flag', reason: `--app-id named ${appIdOverride}` };
  }

  // @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app — F101.
  // The other platform's Expo Go id is dropped before the first one is taken. It is the one id in
  // this list that can be *shown* to be about another device, because Expo Go's two ids differ by a
  // single capital letter and nothing else in a `/json/list` entry names a platform — and the
  // consequence of taking it was silent: `am force-stop host.exp.Exponent` on an emulator exits 0,
  // stops nothing, and prints nothing. An id this cannot place is kept, because a development
  // build's package name says nothing about a platform and a stop with no id to aim at is worse.
  const wrongPlatformExpoGoId = EXPO_GO_APP_ID[platform === 'ios' ? 'android' : 'ios'];
  const connected = targetAppIds.find(
    (id) => id && id !== wrongPlatformExpoGoId && isValidAppId(id)
  );
  if (connected) {
    return {
      appId: connected,
      source: 'dev-server',
      reason: EXPO_GO_APP_IDS.includes(connected)
        ? `the app connected to the dev server is Expo Go (${connected})`
        : `the app connected to the dev server reports ${connected}`,
    };
  }

  if (configured) {
    return {
      appId: configured,
      source: 'app-config',
      reason: `no app is connected to the dev server, and the app config names ${configured} for ${platform}`,
    };
  }

  return {
    appId: EXPO_GO_APP_ID[platform],
    source: 'expo-go-default',
    reason: `no app is connected to the dev server and the app config names no ${platform} application id, so Expo Go is the default target`,
  };
}

/**
 * `ios.bundleIdentifier` or `android.package` from the project's static app config.
 *
 * A dynamic `app.config.js` is never evaluated, per the process boundary of llp/0001
 * constraint 5; such a project answers null and falls through to the Expo Go default, which
 * `--app-id` overrides.
 */
export function readConfiguredAppId(
  projectRoot: string,
  platform: NavigatePlatform
): string | null {
  for (const fileName of STATIC_CONFIG_FILES) {
    const config = readJsonFile(path.join(projectRoot, fileName));
    if (config == null) {
      continue;
    }
    const expo = (isRecord(config.expo) ? config.expo : config) as Record<string, unknown>;
    const platformConfig = isRecord(expo[platform])
      ? (expo[platform] as Record<string, unknown>)
      : null;
    const value = platformConfig?.[platform === 'ios' ? 'bundleIdentifier' : 'package'];
    if (typeof value === 'string' && value.trim().length > 0) {
      // A malformed id is treated as absent, which is the same fall-through as a config that names
      // none: the Expo Go default, which `--app-id` overrides.
      return isValidAppId(value.trim()) ? value.trim() : null;
    }
  }
  return null;
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
