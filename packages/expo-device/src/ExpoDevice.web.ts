import UAParser from 'ua-parser-js';

const parser = new UAParser(window.navigator.userAgent);
var result = parser.getResult();

export default {
  get name(): string {
    return 'ExpoDevice';
  },
  get isDevice(): boolean {
    return true;
  },
  get modelName(): string | undefined {
    return result.device.model;
  },
  get osName(): string {
    return result.os.name;
  },
  get osVersion(): string {
    return result.os.version;
  },
  get supportedCpuArchitectures(): string[] | undefined {
    return result.cpu.architecture;
  },
  get deviceName(): string | undefined {
    const { browser, engine, os: OS } = parser.getResult();
    return browser.name || engine.name || OS.name || undefined;
  },
  get deviceYearClass(): null | number {
    return null;
  },
  get osBuildId(): null {
    return null;
  },
  get osInternalBuildId(): null {
    return null;
  },
  get totalMemory(): null {
    return null;
  },
  get modelId(): null {
    return null;
  },
  get manufacturer(): null {
    return null;
  },
  get brand(): null {
    return null;
  },
  get osBuildFingerprint(): null {
    return null;
  },
  get designName(): null {
    return null;
  },
  get productName(): null {
    return null;
  },
  get platformApiLevel(): null {
    return null;
  },
};
