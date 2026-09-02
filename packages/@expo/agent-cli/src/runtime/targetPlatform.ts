// @ref llp/0005-runtime-loop-tools.rfc.md §Android
// Which platform one debugger target is running on.
//
// `--android` used to scope the *device* commands and nothing else: the deep link went to the
// emulator, and every reading command then took whatever `/json/list` happened to name first. With
// an iOS simulator and an Android emulator both attached to one dev server, `smoke --android`
// opened the app on the emulator and earned its `passed` from the **iOS** runtime
// [observed — friction run 6 (Android), 2026-08-24]. A verdict about Android that an iOS runtime
// answered is worse than no verdict.
//
// **The dev server does not label the platform.** Two live targets, captured side by side on one
// dev server [observed — 2026-08-25, notesapp on SDK 57, port 8250]:
//
// ```json
// { "appId": "host.exp.Exponent", "deviceName": "iPhone 17 Pro",
//   "title": "host.exp.Exponent (iPhone 17 Pro)", "description": "React Native Bridgeless [C++ connection]" }
// { "appId": "host.exp.exponent", "deviceName": "sdk_gphone64_arm64 - 15 - API 35",
//   "title": "host.exp.exponent (Google sdk_gphone64_arm64)", "description": "React Native Bridgeless [C++ connection]" }
// ```
//
// `type`, `description` and the `reactNative` block are identical. What differs is `deviceName`,
// and `appId` by one capital letter. So the platform is *inferred*, in this order, strongest first:
//
//  1. **The device name is one this machine's device tools just named.** A booted simulator is
//     called `iPhone 17 Pro` by `simctl`, and an attached emulator is `model:sdk_gphone64_arm64` in
//     `adb devices -l`. This is evidence rather than a pattern: the name came from the same device
//     the command is about to drive.
//  2. **The device name has React Native Android's shape.** `AndroidInfoHelpers.getFriendlyDeviceName`
//     builds `<Build.MODEL> - <release> - API <sdk>`, which is where the ` - 15 - API 35` above
//     comes from. Nothing on iOS produces it.
//  3. **The app id is Expo Go's, and the two platforms spell it differently.** `host.exp.Exponent`
//     is the iOS bundle id and `host.exp.exponent` the Android package. A one-capital difference is
//     thin evidence, which is why it is last — and it only ever fires for Expo Go.
//
// When none of them fires the answer is `null`, and `null` is never quietly folded into either
// platform: a caller that cannot tell says so.

import type { NavigatePlatform } from '../navigate/device';
import type { CdpTarget } from './cdpClient';

/** What this machine's device tools say is attached, so a target can be matched back to one. */
export interface DeviceNameIndex {
  /** Names of booted iOS simulators, as `xcrun simctl` reports them. */
  iosNames: string[];
  /** Hardware models of attached Android devices, as `adb devices -l` reports them. */
  androidModels: string[];
}

/** An index that knows nothing, for a caller with no device tools to ask. */
export const EMPTY_DEVICE_INDEX: DeviceNameIndex = { iosNames: [], androidModels: [] };

/** Expo Go's application id, which differs between the platforms by one capital letter. */
const EXPO_GO_IOS_APP_ID = 'host.exp.Exponent';
const EXPO_GO_ANDROID_APP_ID = 'host.exp.exponent';

/**
 * React Native Android's device name: `<model> - <release> - API <sdk>`
 * [`AndroidInfoHelpers.getFriendlyDeviceName`].
 */
const ANDROID_FRIENDLY_DEVICE_NAME = / - .+ - API \d+$/;

export interface TargetPlatformVerdict {
  /** The platform this target runs on, or null when nothing decided it. */
  platform: NavigatePlatform | null;
  /** One clause naming what decided it, for a report that has to justify a verdict. */
  evidence: string;
}

/**
 * Work out which platform one debugger target is running on.
 *
 * @param index what this machine's device tools reported, or {@link EMPTY_DEVICE_INDEX} when they
 * were not asked. The last two rules need no index at all, so a machine with no `adb` still tells
 * an Expo Go Android target apart from an iOS one.
 */
export function platformOfTarget(
  target: Pick<CdpTarget, 'appId' | 'deviceName'>,
  index: DeviceNameIndex = EMPTY_DEVICE_INDEX
): TargetPlatformVerdict {
  const deviceName = typeof target.deviceName === 'string' ? target.deviceName : '';

  if (deviceName && index.iosNames.includes(deviceName)) {
    return {
      platform: 'ios',
      evidence: `its device name "${deviceName}" is a booted iOS simulator`,
    };
  }

  const model = index.androidModels.find(
    (candidate) => candidate === deviceName || deviceName.startsWith(`${candidate} - `)
  );
  if (model) {
    return {
      platform: 'android',
      evidence: `its device name "${deviceName}" is the model of the attached Android device "${model}"`,
    };
  }

  if (ANDROID_FRIENDLY_DEVICE_NAME.test(deviceName)) {
    return {
      platform: 'android',
      evidence: `its device name "${deviceName}" has React Native Android's "<model> - <release> - API <sdk>" shape`,
    };
  }

  if (target.appId === EXPO_GO_IOS_APP_ID) {
    return {
      platform: 'ios',
      evidence: `its app id is Expo Go's iOS bundle id (${EXPO_GO_IOS_APP_ID})`,
    };
  }
  if (target.appId === EXPO_GO_ANDROID_APP_ID) {
    return {
      platform: 'android',
      evidence: `its app id is Expo Go's Android package (${EXPO_GO_ANDROID_APP_ID})`,
    };
  }

  return {
    platform: null,
    evidence: `nothing in the target names a platform: app id "${target.appId ?? ''}", device name "${deviceName}"`,
  };
}

/** The three groups one platform flag splits a target list into. */
export interface ScopedTargets {
  /** Targets shown to be on the platform that was asked for. */
  matched: CdpTarget[];
  /** Targets shown to be on another platform. */
  otherPlatform: { target: CdpTarget; platform: NavigatePlatform }[];
  /** Targets whose platform nothing decided. Never counted as either. */
  undetermined: CdpTarget[];
}

/**
 * Split a target list by platform.
 *
 * `undetermined` is its own group rather than being folded into `matched`, and that is the whole
 * point: a run that cannot tell what it is talking to must not earn a platform's verdict from it.
 */
export function scopeTargets(
  targets: CdpTarget[],
  platform: NavigatePlatform,
  index: DeviceNameIndex = EMPTY_DEVICE_INDEX
): ScopedTargets {
  const scoped: ScopedTargets = { matched: [], otherPlatform: [], undetermined: [] };
  for (const target of targets) {
    const verdict = platformOfTarget(target, index);
    if (verdict.platform === platform) {
      scoped.matched.push(target);
    } else if (verdict.platform != null) {
      scoped.otherPlatform.push({ target, platform: verdict.platform });
    } else {
      scoped.undetermined.push(target);
    }
  }
  return scoped;
}

/**
 * The platforms a set of targets is running on, and whether any of them could not be read.
 *
 * What a command with **no** platform flag uses to find out what it is looking at — which is how
 * `runtime:reload` stopped checking an iOS bundle for an Android-only app (F53).
 */
export function platformsOfTargets(
  targets: CdpTarget[],
  index: DeviceNameIndex = EMPTY_DEVICE_INDEX
): { platforms: NavigatePlatform[]; undetermined: number } {
  const platforms: NavigatePlatform[] = [];
  let undetermined = 0;
  for (const target of targets) {
    const { platform } = platformOfTarget(target, index);
    if (platform == null) {
      undetermined += 1;
    } else if (!platforms.includes(platform)) {
      platforms.push(platform);
    }
  }
  return { platforms, undetermined };
}

/**
 * The device index, but only when the index-free rules cannot place every target.
 *
 * Two subprocesses are cheap and not free, and Expo Go — the case nearly every one of these
 * commands runs against — is placed by its app id alone. So the tools are spawned exactly when
 * their answer could change the outcome: a development build whose device name and app id say
 * nothing this module recognises.
 */
export async function buildDeviceNameIndexIfNeededAsync(
  targets: readonly Pick<CdpTarget, 'appId' | 'deviceName'>[]
): Promise<DeviceNameIndex> {
  const undetermined = targets.some((target) => platformOfTarget(target).platform == null);
  return undetermined ? await buildDeviceNameIndexAsync() : EMPTY_DEVICE_INDEX;
}

/**
 * Ask this machine's device tools what is attached.
 *
 * Never throws and never fails a command: a missing `xcrun` or `adb` only costs the strongest of
 * the three rules above, and the other two still answer for Expo Go and for React Native Android.
 */
export async function buildDeviceNameIndexAsync(): Promise<DeviceNameIndex> {
  const { runAdbAsync } = require('../device/adb') as typeof import('../device/adb');
  const { parseAndroidDevices } =
    require('../navigate/device') as typeof import('../navigate/device');
  const { spawnCaptureAsync } =
    require('../utils/spawnCapture') as typeof import('../utils/spawnCapture');

  const [simctl, adb] = await Promise.all([
    spawnCaptureAsync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j']).catch(() => null),
    runAdbAsync(['devices', '-l']).catch(() => null),
  ]);

  return {
    iosNames: simctl?.exitCode === 0 ? bootedSimulatorNames(simctl.stdout) : [],
    androidModels:
      adb?.exitCode === 0
        ? parseAndroidDevices(adb.stdout)
            .map((device) => device.model)
            .filter((model): model is string => model != null)
        : [],
  };
}

/**
 * Every booted simulator name in `simctl list devices booted -j`.
 *
 * Every runtime, not only iOS: this index answers "is this name one of *our* simulators", and a
 * watchOS simulator's name would otherwise fall through to a later rule that knows less.
 */
export function bootedSimulatorNames(stdout: string): string[] {
  let parsed: { devices?: Record<string, { name?: string }[]> };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return [];
  }
  const names: string[] = [];
  for (const devices of Object.values(parsed.devices ?? {})) {
    for (const device of Array.isArray(devices) ? devices : []) {
      if (typeof device?.name === 'string' && device.name) {
        names.push(device.name);
      }
    }
  }
  return names;
}
