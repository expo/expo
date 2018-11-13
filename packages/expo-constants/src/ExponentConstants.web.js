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
    throw new Error(`ExponentConstants.deviceId: is unimplemented on this platform.`);
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
    throw new Error(`ExponentConstants.expoRuntimeVersion: is unimplemented on this platform.`);
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
    throw new Error(`ExponentConstants.deviceYearClass: is unimplemented on this platform.`);
  },
  getWebViewUserAgentAsync(): Promise {
    return navigator.userAgent || null;
  },
};
