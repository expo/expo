import fs from 'fs';
import path from 'path';

import type { GradleProps } from './resolveGradlePropsAsync';
import type { Device } from '../../start/platforms/android/adb';
import { DeviceABI, getDeviceABIsAsync } from '../../start/platforms/android/adb';

const debug = require('debug')('expo:run:android:resolveInstallApkName') as typeof console.log;

type OutputMetadataElement = {
  filters: { filterType: string; value: string }[];
  outputFile: string;
};

type OutputMetadata = {
  elements: OutputMetadataElement[];
};

function resolveApkFromOutputMetadata(
  apkVariantDirectory: string,
  availableCPUs: string[]
): string | null {
  const metadataPath = path.join(apkVariantDirectory, 'output-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  let metadata: OutputMetadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    debug('Failed to parse output-metadata.json');
    return null;
  }

  const { elements } = metadata;
  if (!elements?.length) {
    return null;
  }

  debug('output-metadata.json elements:', elements.map((e) => e.outputFile).join(', '));

  // ABI split: match by device ABI. Exclude DeviceABI.universal — AGP never uses it as an ABI filter.
  const isAbiSplit = elements.some((e) => e.filters.some((f) => f.filterType === 'ABI'));
  if (isAbiSplit) {
    const deviceCPUs = availableCPUs.filter((cpu) => cpu !== DeviceABI.universal);
    for (const cpu of deviceCPUs) {
      const match = elements.find((e) =>
        e.filters.some((f) => f.filterType === 'ABI' && f.value === cpu)
      );
      if (match && fs.existsSync(path.join(apkVariantDirectory, match.outputFile))) {
        debug('Resolved ABI-split APK from output-metadata.json:', match.outputFile);
        return match.outputFile;
      }
    }
    return null;
  }

  // Single universal APK. Density/language splits produce multiple elements without ABI filters;
  // we don't attempt to resolve those here.
  if (elements.length !== 1) {
    return null;
  }
  const apkFile = elements[0]?.outputFile;
  if (apkFile && fs.existsSync(path.join(apkVariantDirectory, apkFile))) {
    debug('Resolved APK from output-metadata.json:', apkFile);
    return apkFile;
  }

  return null;
}

export async function resolveInstallApkNameAsync(
  device: Pick<Device, 'name' | 'pid'>,
  { appName, buildType, flavors, apkVariantDirectory }: GradleProps
) {
  const availableCPUs = await getDeviceABIsAsync(device);
  availableCPUs.push(DeviceABI.universal);

  debug('Supported ABIs: ' + availableCPUs.join(', '));
  debug('Searching for APK: ' + apkVariantDirectory);

  // Check for cpu specific builds first
  for (const availableCPU of availableCPUs) {
    const apkName = getApkFileName(appName, buildType, flavors, availableCPU);
    const apkPath = path.join(apkVariantDirectory, apkName);
    debug('Checking for APK at:', apkPath);
    if (fs.existsSync(apkPath)) {
      return apkName;
    }
  }

  // Otherwise use the default apk named after the variant: app-debug.apk
  const apkName = getApkFileName(appName, buildType, flavors);
  const apkPath = path.join(apkVariantDirectory, apkName);
  debug('Checking for fallback APK at:', apkPath);
  if (fs.existsSync(apkPath)) {
    return apkName;
  }

  // Last resort: read AGP's output-metadata.json to handle custom outputFileName overrides.
  return resolveApkFromOutputMetadata(apkVariantDirectory, availableCPUs);
}

function getApkFileName(
  appName: string,
  buildType: string,
  flavors?: string[] | null,
  cpuArch?: string | null
) {
  let apkName = `${appName}-`;
  if (flavors) {
    apkName += flavors.reduce((rest, flavor) => `${rest}${flavor}-`, '');
  }
  if (cpuArch) {
    apkName += `${cpuArch}-`;
  }
  apkName += `${buildType}.apk`;

  return apkName;
}
