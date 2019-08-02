import UAParser from 'ua-parser-js';

const parser = new UAParser(window.navigator.userAgent);
const result = parser.getResult();

export default {
  get isDevice(): boolean {
    return true;
  },
  get modelName(): string | null {
    return result.device.model || null;
  },
  get osName(): string {
    return result.os.name;
  },
  get osVersion(): string {
    return result.os.version;
  },
  get supportedCpuArchitectures(): string[] | null {
    return result.cpu.architecture ? [result.cpu.architecture] : null;
  },
  get deviceName(): string | null {
    const { browser, engine, os: OS } = parser.getResult();
    return browser.name || engine.name || OS.name || null;
  },
  get deviceYearClass(): null {
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
  get manufacturer(): null {
    return null;
  },
  get brand(): null {
    return null;
  },
};
