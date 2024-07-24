import fs from 'fs';
import path from 'path';

import { GradleProps } from './resolveGradlePropsAsync';
import { Device, DeviceABI, getDeviceABIsAsync } from '../../start/platforms/android/adb';

const debug = require('debug')('expo:run:android:resolveInstallApkName') as typeof console.log;

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

  return null;
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
