import fs from 'fs';
import path from 'path';

import { GradleProps } from './resolveGradlePropsAsync';
import { Device, DeviceABI, getDeviceABIsAsync } from '../../start/platforms/android/adb';

const debug = require('debug')('expo:run:android:resolveInstallApkName') as typeof console.log;

type OutputMetadataElement = {
  filters?: { filterType: string; value: string }[];
  outputFile: string;
};

type OutputMetadata = {
  elements: OutputMetadataElement[];
};

function resolveApkFromOutputMetadata(
  apkVariantDirectory: string,
  availableCPUs: DeviceABI[]
): string | null {
  const metadataPath = path.join(apkVariantDirectory, 'output-metadata.json');
  let metadata: OutputMetadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    debug('Failed to parse output-metadata.json', error);
    return null;
  }

  const { elements } = metadata;
  if (!elements?.length) {
    return null;
  }

  // ABI split: match by device ABI. Exclude DeviceABI.universal — AGP never uses it as an ABI filter.
  const isAbiSplit = elements.some((e) => e?.filters?.some((f) => f?.filterType === 'ABI'));
  if (isAbiSplit) {
    for (const cpu of availableCPUs) {
      if (cpu === DeviceABI.universal) {
        continue;
      }
      const match = elements.find((e) =>
        e?.filters?.some((f) => f.filterType === 'ABI' && f.value === cpu)
      );
      const outputFile = match?.outputFile;
      if (typeof outputFile === 'string' && fs.existsSync(path.join(apkVariantDirectory, outputFile))) {
        debug('Resolved ABI-split APK from output-metadata.json:', outputFile);
        return outputFile;
      }
    }
    return null;
  }

  if (elements.length === 1) {
    const outputFile = elements[0]?.outputFile;
    if (typeof outputFile === 'string' && fs.existsSync(path.join(apkVariantDirectory, outputFile))) {
      debug('Resolved APK from output-metadata.json:', outputFile);
      return outputFile;
    }
  }

  // Density/language splits produce multiple elements without ABI filters
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
