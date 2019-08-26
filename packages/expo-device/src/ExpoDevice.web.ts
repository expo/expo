import UAParser from 'ua-parser-js';

import { DeviceType } from './Device.types';

const parser = new UAParser(window.navigator.userAgent);
const result = parser.getResult();

export default {
  get isDevice(): boolean {
    return true;
  },
  get brand(): null {
    return null;
  },
  get manufacturer(): null {
    return result.device.vendor || null;
  },
  get modelName(): string | null {
    return result.device.model || null;
  },
  get deviceYearClass(): null {
    return null;
  },
  get totalMemory(): null {
    return null;
  },
  get supportedCpuArchitectures(): string[] | null {
    return result.cpu.architecture ? [result.cpu.architecture] : null;
  },
  get osName(): string {
    return result.os.name;
  },
  get osVersion(): string {
    return result.os.version;
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
