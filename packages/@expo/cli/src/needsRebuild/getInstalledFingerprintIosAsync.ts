import fs from 'fs';
import path from 'path';

import { AppleAppIdResolver } from '../start/platforms/ios/AppleAppIdResolver';
import { DeviceCtlDevice, getConnectedAppleDevicesAsync } from '../start/platforms/ios/devicectl';
import { getBootedSimulatorsAsync, getContainerPathAsync } from '../start/platforms/ios/simctl';
import { getInstalledFingerprintIosDeviceAsync } from './getInstalledFingerprintIosDeviceAsync';
import {
  FINGERPRINT_FILE_NAME,
  InstalledFingerprintResult,
  pickBestResult,
} from './installedFingerprint';

/**
 * Read the build-time fingerprint from the app installed on an iOS simulator or a physical
 * device. Booted simulators are the fast, filesystem-based path (see `readSimulatorAsync`) and
 * are always preferred: a physical device can only be read by launching the app and waiting for
 * it to report its fingerprint back (see `getInstalledFingerprintIosDeviceAsync`), which is
 * slower and disturbs whatever the app was doing. The physical-device path only runs when it is
 * the clear choice: `--device` names a connected phone (and no booted simulator matches that
 * name), or no simulator is booted and exactly one phone is connected. Everywhere else — an
 * inconclusive simulator result, or several phones and no filter — the phone is never probed
 * automatically; a hint names it and asks for `--device`.
 * `expectedHash` may be a promise so device reads overlap with the fingerprint computation;
 * it is only awaited at comparison time.
 */
export async function getInstalledFingerprintIosAsync(
  projectRoot: string,
  {
    expectedHash,
    device: deviceFilter,
    appId: appIdOverride,
    timeoutMs,
  }: {
    expectedHash: string | Promise<string>;
    device?: string;
    appId?: string;
    timeoutMs?: number;
  }
): Promise<InstalledFingerprintResult> {
  let simulators = (await getBootedSimulatorsAsync()).filter(
    (simulator) => simulator.osType === 'iOS'
  );

  // Enumerating physical devices takes devicectl over a second, so only ask when a simulator
  // cannot answer, and at most once. A devicectl failure (old Xcode, broken CoreDevice) must not
  // break the simulator path — treat it as "no physical devices". Developer Mode is deliberately
  // not filtered here: the device reader reports it with an actionable message instead.
  let physicalDevices: Promise<DeviceCtlDevice[]> | undefined;
  const listPhysicalDevicesAsync = () => {
    physicalDevices ??= getConnectedAppleDevicesAsync()
      .then((devices) =>
        devices.filter(
          (device) =>
            device.hardwareProperties.platform === 'iOS' &&
            // A paired device that isn't reachable (unplugged, tunnel down) can't be probed —
            // the same filter `expo run:ios` applies.
            device.connectionProperties.pairingState === 'paired' &&
            device.connectionProperties.tunnelState !== 'unavailable'
        )
      )
      .catch(() => []);
    return physicalDevices;
  };

  if (deviceFilter) {
    // Case-insensitive, matching how `expo run:ios --device` resolves devices.
    const filter = deviceFilter.toLowerCase();
    const matchesFilter = (name: string, identifier: string) =>
      identifier.toLowerCase() === filter || name.toLowerCase() === filter;

    const matchingSimulators = simulators.filter((simulator) =>
      matchesFilter(simulator.name, simulator.udid)
    );
    if (!matchingSimulators.length) {
      const devices = await listPhysicalDevicesAsync();
      const matchesPhysicalDevice = devices.some((device) =>
        matchesFilter(device.deviceProperties.name, device.hardwareProperties.udid)
      );
      if (matchesPhysicalDevice) {
        return getInstalledFingerprintIosDeviceAsync(projectRoot, {
          expectedHash,
          device: deviceFilter,
          appId: appIdOverride,
          devices,
          timeoutMs,
        });
      }
      return { status: 'no-device' };
    }
    simulators = matchingSimulators;
  } else if (!simulators.length) {
    const devices = await listPhysicalDevicesAsync();
    if (!devices.length) {
      return { status: 'no-device' };
    }
    if (devices.length > 1) {
      // Probing launches the app on the phone; doing that on every connected phone unprompted
      // is too intrusive. Ask the developer to name one.
      const names = devices.map((device) => device.deviceProperties.name).join(', ');
      return {
        status: 'no-device',
        hint: `Several physical iOS devices are connected (${names}). Pick one with --device "<name>" — the check launches the app on it.`,
      };
    }
    return getInstalledFingerprintIosDeviceAsync(projectRoot, {
      expectedHash,
      appId: appIdOverride,
      devices,
      timeoutMs,
    });
  }

  const appId = appIdOverride ?? (await new AppleAppIdResolver(projectRoot).getAppIdAsync());

  const settled = await Promise.allSettled(
    simulators.map((simulator) => readSimulatorAsync(simulator, appId))
  );

  const results: InstalledFingerprintResult[] = [];
  let lastError: unknown = null;
  for (const entry of settled) {
    if (entry.status === 'fulfilled') {
      results.push(entry.value);
    } else {
      // One failing simulator (e.g. mid-shutdown) must not shadow a readable install on
      // another. Skip it; throw only when no simulator could be read at all.
      lastError = entry.reason;
    }
  }
  if (!results.length) {
    throw lastError;
  }
  const hash = await expectedHash;
  const result = pickBestResult(results, hash);

  const simulatorAnswered = result.status === 'ok' && result.hash === hash;
  if (!simulatorAnswered && !deviceFilter) {
    // Never launch the app on the phone automatically just to check it — that disturbs
    // whatever the developer was doing on it. Name it, and let `--device` opt in. This also
    // covers a stale simulator install: the phone may already hold a current build.
    const [physicalDevice] = await listPhysicalDevicesAsync();
    if (physicalDevice) {
      const name = physicalDevice.deviceProperties.name;
      return {
        ...result,
        hint: `A physical iOS device is also connected (${name}). Check it with --device "${name}" — physical devices are only checked on request, since the check launches the app.`,
      };
    }
  }
  return result;
}

async function readSimulatorAsync(
  simulator: { name: string; udid: string },
  appId: string
): Promise<InstalledFingerprintResult> {
  const device = { name: simulator.name, identifier: simulator.udid };

  const containerPath = await getContainerPathAsync(simulator, { appId });
  if (!containerPath) {
    return { status: 'app-not-installed', appId, device };
  }

  // The resource bundle sits at the app bundle root for static linking, and inside the
  // framework when the project uses `use_frameworks!`.
  const candidates = [
    path.join(containerPath, 'EXConstants.bundle', FINGERPRINT_FILE_NAME),
    path.join(
      containerPath,
      'Frameworks',
      'EXConstants.framework',
      'EXConstants.bundle',
      FINGERPRINT_FILE_NAME
    ),
  ];
  for (const candidate of candidates) {
    try {
      const hash = fs.readFileSync(candidate, 'utf8').trim();
      if (hash) {
        return { status: 'ok', hash, appId, device };
      }
    } catch {
      // Try the next location.
    }
  }
  return { status: 'no-embedded-fingerprint', appId, device };
}
