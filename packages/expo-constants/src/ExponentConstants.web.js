// @flow

import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import uuidv4 from 'uuid/v4';
import parser from 'ua-parser-js';

export default {
  _sessionId: uuidv4(),
  get name(): string {
    return 'ExponentConstants';
  },
  get sessionId(): string {
    return this._sessionId;
  },
  get platform(): object {
    return { web: parser(navigator.userAgent) };
  },
  get isDevice(): boolean {
    return true;
  },
  get expoVersion(): string {
    return '32';
  },
  get linkingUri(): string {
    return global.location.href.split('?')[0].split('#')[0];
  },
  get expoRuntimeVersion(): ?string {
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
    throw new Error(`ExponentConstants.deviceYearClass: is unimplemented on this platform.`);
  },
  getWebViewUserAgentAsync(): Promise {
    const { navigator = {} } = global;
    return canUseDOM ? navigator.userAgent : null;
  },
};
