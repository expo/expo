import uuidv4 from 'uuid/v4';
import UAParser from 'ua-parser-js';
import { DeviceUUID } from 'device-uuid';

const ExpoPackageJson = require('expo/package.json');

const parser = new UAParser();
const deviceId = new DeviceUUID().get();

declare var process: any;

export default {
  _sessionId: uuidv4(),
  get appOwnership() {
    return 'expo';
  },
  get installationId() {
    return deviceId;
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
    // TODO: Bacon: Possibly want to add information regarding simulators
    return true;
  },
  get expoVersion(): string {
    return ExpoPackageJson.version;
  },
  get linkingUri(): string {
    return location.origin + location.pathname;
  },
  get expoRuntimeVersion(): string | null {
    return null;
  },
  get deviceName(): string | null {
    const { browser, engine, os: OS } = parser.getResult();

    return browser.name || engine.name || OS.name || null;
  },
  get systemFonts(): string[] {
    // TODO: Bacon: Maybe possible.
    return [];
  },
  get statusBarHeight(): number {
    return 0;
  },
  get deviceYearClass(): string | null {
    // TODO: Bacon: The android version isn't very accurate either, maybe we could try and guess this value.
    console.log(`ExponentConstants.deviceYearClass: is unimplemented on web.`);
    return null;
  },
  get manifest(): { [manifestKey: string]: any } {
    return process.env.APP_MANIFEST || {};
  },
  async getWebViewUserAgentAsync(): Promise<string> {
    return navigator.userAgent;
  },
};
