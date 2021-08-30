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
  async getDeviceTypeAsync(): Promise<DeviceType> {
    switch (result.device.type) {
      case 'mobile':
        return DeviceType.PHONE;
      case 'tablet':
        return DeviceType.TABLET;
      case 'smarttv':
        return DeviceType.TV;
      case 'console':
      case 'embedded':
      case 'wearable':
        return DeviceType.UNKNOWN;
      default:
        return DeviceType.DESKTOP;
    }
  },
  async isRootedExperimentalAsync(): Promise<boolean> {
    return false;
  },
};
