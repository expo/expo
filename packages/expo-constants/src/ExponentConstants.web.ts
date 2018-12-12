import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';

const ExpoPackageJson = require('expo/package.json');

export default {
  _sessionId: uuidv4(),
  get appOwnership() {
    return 'expo';
  },
  get deviceId() {
    console.warn(`ExponentConstants.deviceId: is unimplemented on this platform.`);
    return null;
  },
  get name(): string {
    return 'ExponentConstants';
  },
  get sessionId(): string {
    return this._sessionId;
  },
  get platform(): object {
    return { web: UAParser(navigator.userAgent) };
  },
  get isDevice(): boolean {
    return true;
  },
  get expoVersion(): string {
    return ExpoPackageJson.version;
  },
  get linkingUri(): string {
    return location.origin + location.pathname;
  },
  get expoRuntimeVersion(): string | null {
    console.warn(`ExponentConstants.expoRuntimeVersion: is unimplemented on this platform.`);
    return null;
  },
  get deviceName(): string | null {
    return null;
  },
  get systemFonts(): string[] {
    return [];
  },
  get statusBarHeight(): number {
    return 0;
  },
  get deviceYearClass(): string | null {
    console.warn(`ExponentConstants.deviceYearClass: is unimplemented on this platform.`);
    return null;
  },
  get manifest(): { [manifestKey: string]: any } {
    /* TODO: Bacon: Populate */

    return {};
  },
  async getWebViewUserAgentAsync(): Promise<string> {
    return navigator.userAgent;
  }
};
