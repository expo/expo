// @flow

import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
import ExpoPackageJson from 'expo/package.json';

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
  get expoRuntimeVersion(): ?string {
    console.warn(`ExponentConstants.expoRuntimeVersion: is unimplemented on this platform.`);
    return null;
  },
  get deviceName(): ?string {
    return null;
  },
  get systemFonts(): ?Array<string> {
    return [];
  },
  get statusBarHeight(): number {
    return 0;
  },
  get deviceYearClass(): ?string {
    console.warn(`ExponentConstants.deviceYearClass: is unimplemented on this platform.`);
    return null;
  },
  getWebViewUserAgentAsync(): Promise {
    return navigator.userAgent || null;
  },
};
