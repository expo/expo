import crypto from 'crypto';

import { Log } from '../log';
import { AppleAppIdResolver } from '../start/platforms/ios/AppleAppIdResolver';
import {
  classifyDevicectlLaunchError,
  DeviceCtlDevice,
  getConnectedAppleDevicesAsync,
  launchAppWithPayloadUrlAsync,
  openUrlWithDeviceCtlAsync,
} from '../start/platforms/ios/devicectl';
import { getSchemesForIosAsync } from '../utils/scheme';
import { startFingerprintCallbackServerAsync } from './fingerprintCallbackServer';
import { buildFingerprintCheckUrl } from './fingerprintCheckProtocol';
import { InstalledFingerprintResult, pickBestResult } from './installedFingerprint';

/**
 * Read the build-time fingerprint from the app installed on a connected physical iOS device.
 * Unlike the simulator reader, the fingerprint file is not reachable through the filesystem —
 * devicectl exposes no equivalent of `simctl get_app_container`. Instead the CLI launches the
 * app with a URL carrying a one-time nonce and a callback URL; the app (via
 * expo-dev-launcher's fingerprint responder) POSTs its embedded fingerprint back.
 * Devices are probed sequentially and stop at the first match, so a matching device never
 * waits on the (much slower) launch of another one.
 */
export async function getInstalledFingerprintIosDeviceAsync(
  projectRoot: string,
  {
    expectedHash,
    device: deviceFilter,
    appId: appIdOverride,
    devices: knownDevices,
    timeoutMs,
  }: {
    expectedHash: string | Promise<string>;
    device?: string;
    appId?: string;
    /** Pre-enumerated connected devices, so callers that already ran devicectl don't run it twice. */
    devices?: DeviceCtlDevice[];
    timeoutMs?: number;
  }
): Promise<InstalledFingerprintResult> {
  let devices = (knownDevices ?? (await getConnectedAppleDevicesAsync())).filter(
    (candidate) =>
      candidate.hardwareProperties.platform === 'iOS' &&
      // A paired device that isn't actually reachable (unplugged, tunnel down) can't be probed.
      candidate.connectionProperties.pairingState === 'paired' &&
      candidate.connectionProperties.tunnelState !== 'unavailable'
  );
  if (deviceFilter) {
    // Case-insensitive, matching how `expo run:ios --device` resolves devices.
    const filter = deviceFilter.toLowerCase();
    devices = devices.filter(
      (candidate) =>
        candidate.hardwareProperties.udid.toLowerCase() === filter ||
        candidate.deviceProperties.name.toLowerCase() === filter
    );
  }
  // Match by name first, then gate on Developer Mode — so a matched phone with Developer Mode
  // off gets an actionable message instead of a misleading "no device matched".
  const usable = devices.filter(
    (candidate) => candidate.deviceProperties.developerModeStatus === 'enabled'
  );
  if (!usable.length) {
    if (devices.length) {
      const name = devices[0]!.deviceProperties.name;
      return {
        status: 'no-device',
        hint: `${name} is connected, but Developer Mode is off, so the app cannot be launched on it. Enable it in Settings → Privacy & Security → Developer Mode, then retry.`,
      };
    }
    return { status: 'no-device' };
  }

  const appId = appIdOverride ?? (await new AppleAppIdResolver(projectRoot).getAppIdAsync());
  const schemes = await getSchemesForIosAsync(projectRoot);
  const scheme = schemes[0] ?? null;

  const results: InstalledFingerprintResult[] = [];
  for (const candidate of usable) {
    const device = {
      name: candidate.deviceProperties.name,
      identifier: candidate.hardwareProperties.udid,
    };
    // stderr, so `--json` output on stdout stays parseable.
    Log.warn(`Checking ${device.name} — this launches the app on the device.`);
    const result = await probeDeviceAsync(device, appId, scheme, timeoutMs);
    // The hash computation overlaps with the probe; only await it at comparison time.
    if (result.status === 'ok' && result.hash === (await expectedHash)) {
      return result;
    }
    results.push(result);
  }
  return pickBestResult(results, await expectedHash);
}

async function probeDeviceAsync(
  device: { name: string; identifier: string },
  appId: string,
  scheme: string | null,
  timeoutMs?: number
): Promise<InstalledFingerprintResult> {
  const nonce = crypto.randomUUID();
  const server = await startFingerprintCallbackServerAsync({ nonce, timeoutMs });
  try {
    const url = buildFingerprintCheckUrl(scheme, nonce, server.callbackUrl);
    try {
      await launchAppWithPayloadUrlAsync(device.identifier, appId, url);
    } catch (error) {
      if (classifyDevicectlLaunchError(error) === 'app-not-installed') {
        return { status: 'app-not-installed', appId, device };
      }
      // Any other launch failure falls back to `openURL`, which reaches a running app. On
      // Xcode 27, `launch --payload-url` succeeds and delivers the URL even to a running app,
      // so this fallback serves older toolchains — their error wording is unknown, so the
      // fallback must not depend on recognizing it. `openURL` routes by registered scheme; a
      // project with no scheme has nothing for it to match, so there's no way to reach the app.
      if (!scheme) {
        return { status: 'no-response', appId, device };
      }
      try {
        await openUrlWithDeviceCtlAsync(device.identifier, url);
      } catch {
        // The original launch error names the actual failure; the openURL one is downstream.
        throw error;
      }
    }

    const response = await server.result;
    if (!response) {
      return { status: 'no-response', appId, device };
    }
    if (response.fingerprint === null) {
      return { status: 'no-embedded-fingerprint', appId, device };
    }
    return { status: 'ok', hash: response.fingerprint, appId, device };
  } finally {
    server.close();
  }
}
