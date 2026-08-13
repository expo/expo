import fs from 'fs';
import path from 'path';

import { AppleAppIdResolver } from '../start/platforms/ios/AppleAppIdResolver';
import { getBootedSimulatorsAsync, getContainerPathAsync } from '../start/platforms/ios/simctl';
import {
  FINGERPRINT_FILE_NAME,
  InstalledFingerprintResult,
  rankInstalledResult,
} from './installedFingerprint';

/**
 * Read the build-time fingerprint from the app installed on a booted iOS simulator.
 * All booted simulators are checked, and the one with the most informative result wins —
 * a stale install on one simulator must not shadow a matching install on another.
 * `expectedHash` may be a promise so device reads overlap with the fingerprint computation;
 * it is only awaited at comparison time.
 * Physical iOS devices are not supported: the fingerprint lives in the app bundle, which
 * is not reachable through devicectl or the AFC data-container protocols.
 */
export async function getInstalledFingerprintIosAsync(
  projectRoot: string,
  {
    expectedHash,
    device: deviceFilter,
    appId: appIdOverride,
  }: { expectedHash: string | Promise<string>; device?: string; appId?: string }
): Promise<InstalledFingerprintResult> {
  let simulators = (await getBootedSimulatorsAsync()).filter(
    (simulator) => simulator.osType === 'iOS'
  );
  if (deviceFilter) {
    simulators = simulators.filter(
      (simulator) => simulator.udid === deviceFilter || simulator.name === deviceFilter
    );
  }
  if (!simulators.length) {
    return { status: 'no-device' };
  }
  const appId = appIdOverride ?? (await new AppleAppIdResolver(projectRoot).getAppIdAsync());

  const results: InstalledFingerprintResult[] = [];
  let lastError: unknown = null;
  for (const simulator of simulators) {
    try {
      results.push(await readSimulatorAsync(simulator, appId));
    } catch (error) {
      // One failing simulator (e.g. mid-shutdown) must not shadow a readable install on
      // another. Skip it; throw only when no simulator could be read at all.
      lastError = error;
    }
  }
  if (!results.length) {
    throw lastError;
  }
  return pickBestResult(results, await expectedHash);
}

function pickBestResult(
  results: InstalledFingerprintResult[],
  expectedHash: string
): InstalledFingerprintResult {
  let best: InstalledFingerprintResult = { status: 'no-device' };
  for (const result of results) {
    if (result.status === 'ok' && result.hash === expectedHash) {
      return result;
    }
    if (rankInstalledResult(result, expectedHash) > rankInstalledResult(best, expectedHash)) {
      best = result;
    }
  }
  return best;
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
