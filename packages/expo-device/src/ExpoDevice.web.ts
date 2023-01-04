import { Platform } from 'expo-modules-core';
import UAParser from 'ua-parser-js';

import { DeviceType } from './Device.types';

type NavigatorWithDeviceMemory = Navigator & { deviceMemory: number };

let result: any = null;
if (Platform.isDOMAvailable) {
  const parser = new UAParser(window.navigator.userAgent);
  result = parser.getResult();
}

function convertGiBtoBytes(gib: number): number {
  return Math.round(gib * 1024 ** 3);
}

let deviceType = DeviceType.UNKNOWN;
switch (result?.device?.type) {
  case 'mobile':
    deviceType = DeviceType.PHONE;
    break;
  case 'tablet':
    deviceType = DeviceType.TABLET;
    break;
  case 'smarttv':
    deviceType = DeviceType.TV;
    break;
  case 'console':
  case 'embedded':
  case 'wearable':
    deviceType = DeviceType.UNKNOWN;
    break;
  default:
    deviceType = DeviceType.DESKTOP;
}

export default {
  get isDevice(): boolean {
    return true;
  },
  get brand(): null {
    return null;
  },
  get manufacturer(): null {
    return (result && result.device.vendor) || null;
  },
  get modelName(): string | null {
    return (result && result.device.model) || null;
  },
  get deviceYearClass(): null {
    return null;
  },
  get totalMemory(): number | null {
    if (Platform.isDOMAvailable && 'deviceMemory' in navigator) {
      const { deviceMemory } = navigator as NavigatorWithDeviceMemory;
      return convertGiBtoBytes(deviceMemory);
    }
    return null;
  },
  get supportedCpuArchitectures(): string[] | null {
    return result && result.cpu.architecture ? [result.cpu.architecture] : null;
  },
  get osName(): string {
    return (result && result.os.name) || '';
  },
  get osVersion(): string {
    return (result && result.os.version) || '';
  },
  get osBuildId(): null {
    return null;
  },
  get osInternalBuildId(): null {
    return null;
  },
  get deviceName(): null {
    return null;
  },
  get deviceType(): DeviceType {
    return deviceType;
  },
  async getDeviceTypeAsync(): Promise<DeviceType> {
    return deviceType;
  },
  async isRootedExperimentalAsync(): Promise<boolean> {
    return false;
  },
};
