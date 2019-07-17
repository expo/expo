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
  get modelName(): string {
    return result.device.model;
  },
  get manufacturer(): string {
    return result.device.vendor;
  },
  get osName(): string {
    return result.os.name;
  },
  get osVersion(): string {
    return result.os.version;
  },
  get supportedCpuArchitectures(): string[] {
    return result.cpu.architecture;
  }
};
