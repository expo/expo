import fs from 'fs';
import os from 'os';
import path from 'path';

import { AndroidAppIdResolver } from '../start/platforms/android/AndroidAppIdResolver';
import {
  adbArgs,
  adbShellArgs,
  Device,
  getAttachedDevicesAsync,
  getPackagePathsAsync,
  getServer,
  shellQuote,
} from '../start/platforms/android/adb';
import {
  EOCD_MAX_LENGTH,
  LOCAL_HEADER_MAX_LENGTH,
  findCentralDirectoryEntry,
  parseEndOfCentralDirectory,
  readLocalZipEntry,
  readZipEntry,
} from '../utils/zipEntry';
import { debugEvent } from './events';
import {
  FINGERPRINT_FILE_NAME,
  InstalledFingerprintResult,
  rankInstalledResult,
} from './installedFingerprint';

/** Block size for ranged `dd` reads; `dd` seeks, so cost is proportional to bytes read. */
const RANGE_BLOCK_SIZE = 65536;

/**
 * Read the build-time fingerprint from the app installed on an attached Android device or
 * emulator. All authorized devices are checked, and the one with the most informative result
 * wins. The fingerprint is an asset inside the APK; it is extracted with ranged `dd` reads
 * (a few hundred KB) and only falls back to pulling the whole APK when the device lacks the
 * required tools (`base.apk` is world-readable on standard Android builds either way).
 * `expectedHash` may be a promise so the device read overlaps with the fingerprint
 * computation; it is only awaited at comparison time.
 */
export async function getInstalledFingerprintAndroidAsync(
  projectRoot: string,
  {
    expectedHash,
    device: deviceFilter,
    appId: appIdOverride,
  }: { expectedHash: string | Promise<string>; device?: string; appId?: string }
): Promise<InstalledFingerprintResult> {
  let devices = (await getAttachedDevicesAsync()).filter((device) => device.isAuthorized);
  if (deviceFilter) {
    devices = devices.filter(
      (device) => device.pid === deviceFilter || device.name === deviceFilter
    );
  }
  if (!devices.length) {
    return { status: 'no-device' };
  }
  const appId = appIdOverride ?? (await new AndroidAppIdResolver(projectRoot).getAppIdAsync());

  let best: InstalledFingerprintResult | null = null;
  let lastError: Error | null = null;
  for (const attachedDevice of devices) {
    let result: InstalledFingerprintResult;
    try {
      result = await readDeviceAsync(attachedDevice, appId);
    } catch (error: any) {
      // An unreachable device (e.g. adb reports it offline) must not hide evidence from the
      // other devices; it only fails the check when no device can answer.
      debugEvent('device_read_failed', {
        device: attachedDevice.name,
        error: debugEvent.error(error as Error),
      });
      lastError = error;
      continue;
    }
    // A device holding a matching build answers the question — skip the remaining devices.
    const hash = await expectedHash;
    if (result.status === 'ok' && result.hash === hash) {
      return result;
    }
    if (!best || rankInstalledResult(result, hash) > rankInstalledResult(best, hash)) {
      best = result;
    }
  }
  if (!best) {
    throw lastError ?? new Error('No readable Android device was found.');
  }
  return best;
}

async function readDeviceAsync(
  attachedDevice: Device,
  appId: string
): Promise<InstalledFingerprintResult> {
  const device = {
    name: attachedDevice.name,
    identifier: attachedDevice.pid ?? attachedDevice.name,
  };

  const apkPaths = await getPackagePathsAsync(attachedDevice, { appId });
  const apkPath = apkPaths.find((entry) => entry.endsWith('/base.apk')) ?? apkPaths[0];
  if (!apkPath) {
    return { status: 'app-not-installed', appId, device };
  }

  let hash: string | null;
  try {
    hash = await readFingerprintRangedAsync(attachedDevice, apkPath);
  } catch (error: any) {
    debugEvent('ranged_read_failed', {
      device: attachedDevice.name,
      error: debugEvent.error(error as Error),
    });
    hash = await readFingerprintByPullingAsync(attachedDevice, apkPath);
  }
  if (!hash) {
    return { status: 'no-embedded-fingerprint', appId, device };
  }
  return { status: 'ok', hash, appId, device };
}

/**
 * Extract the fingerprint asset by reading only the zip structures it needs: the tail of the
 * file (end-of-central-directory record), the central directory, and the entry itself —
 * a few hundred KB instead of the whole (often >100 MB) APK.
 */
async function readFingerprintRangedAsync(
  attachedDevice: Device,
  apkPath: string
): Promise<string | null> {
  const sizeOutput = await getServer().runAsync(
    adbShellArgs(attachedDevice.pid, 'stat', '-c', '%s', apkPath)
  );
  const size = parseInt(sizeOutput.trim(), 10);
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`Could not determine the APK size (stat returned: ${sizeOutput.trim()})`);
  }

  const tailLength = Math.min(size, EOCD_MAX_LENGTH);
  const tailStart = size - tailLength;
  const tail = await readRangeAsync(attachedDevice, apkPath, tailStart, tailLength);
  const directory = parseEndOfCentralDirectory(tail);

  const centralDirectory =
    directory.offset >= tailStart
      ? tail.subarray(directory.offset - tailStart, directory.offset - tailStart + directory.size)
      : await readRangeAsync(attachedDevice, apkPath, directory.offset, directory.size);
  const location = findCentralDirectoryEntry(
    centralDirectory,
    directory.entryCount,
    `assets/${FINGERPRINT_FILE_NAME}`
  );
  if (!location) {
    return null;
  }

  const windowLength = Math.min(
    LOCAL_HEADER_MAX_LENGTH + location.compressedSize,
    size - location.localHeaderOffset
  );
  const local = await readRangeAsync(
    attachedDevice,
    apkPath,
    location.localHeaderOffset,
    windowLength
  );
  return readLocalZipEntry(local, location).toString('utf8').trim() || null;
}

/** Read a byte range of a device file with a seeking `dd` over binary-safe `adb exec-out`. */
async function readRangeAsync(
  attachedDevice: Device,
  filePath: string,
  offset: number,
  length: number
): Promise<Buffer> {
  const skip = Math.floor(offset / RANGE_BLOCK_SIZE);
  const start = offset % RANGE_BLOCK_SIZE;
  const count = Math.ceil((start + length) / RANGE_BLOCK_SIZE);
  // The whole command must be a single argument: with one argument `exec-out` runs it through
  // the device shell (quoting and the stderr redirect work); with separate tokens it does not,
  // and dd's stderr summary corrupts the binary stream.
  const raw = await getServer().runRawAsync(
    adbArgs(
      attachedDevice.pid,
      'exec-out',
      `dd if=${shellQuote(filePath)} bs=${RANGE_BLOCK_SIZE} skip=${skip} count=${count} 2>/dev/null`
    )
  );
  if (raw.length < start + length) {
    throw new Error(
      `Short read from ${filePath}: expected ${length} bytes at offset ${offset}, got ${raw.length - start}`
    );
  }
  return raw.subarray(start, start + length);
}

/** Fallback: pull the whole APK to a temporary directory and read the asset locally. */
async function readFingerprintByPullingAsync(
  attachedDevice: Device,
  apkPath: string
): Promise<string | null> {
  const temporaryDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expo-needs-rebuild-'));
  try {
    const localApkPath = path.join(temporaryDir, 'app.apk');
    await getServer().runAsync(adbArgs(attachedDevice.pid, 'pull', apkPath, localApkPath));
    const entry = readZipEntry(
      await fs.promises.readFile(localApkPath),
      `assets/${FINGERPRINT_FILE_NAME}`
    );
    return entry?.toString('utf8').trim() || null;
  } finally {
    await fs.promises.rm(temporaryDir, { recursive: true, force: true });
  }
}
