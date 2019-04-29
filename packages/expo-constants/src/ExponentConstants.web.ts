import UAParser from 'ua-parser-js';
import UUID from 'uuid-js';

import { PlatformManifest, WebManifest, NativeConstants } from './Constants.types';

function getExpoVersion(): string | null {
  try {
    // Remove the need to install the entire expo package.
    return require('expo/package.json').version;
  } catch (error) {
    return null;
  }
}

const version = getExpoVersion();

const parser = new UAParser();
const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';

declare var process: { env: any };
declare var navigator: Navigator;
declare var location: Location;
declare var localStorage: Storage;

const _sessionId = UUID.create(4).toString();

export default {
  get name(): string {
    return 'ExponentConstants';
  },
  get appOwnership(): 'expo' {
    return 'expo';
  },
  get installationId(): string {
    let installationId;
    try {
      installationId = localStorage.getItem(ID_KEY);
      if (installationId == null || typeof installationId !== 'string') {
        installationId = UUID.create(4).toString();
        localStorage.setItem(ID_KEY, installationId as string);
      }
    } catch (error) {
      installationId = _sessionId;
    } finally {
      return installationId;
    }
  },
  get sessionId(): string {
    return _sessionId;
  },
  get platform(): PlatformManifest {
    return { web: UAParser(navigator.userAgent) };
  },
  get isHeadless(): false {
    return false;
  },
  get isDevice(): true {
    // TODO: Bacon: Possibly want to add information regarding simulators
    return true;
  },
  get isDetached(): false {
    return false;
  },
  get expoVersion(): string | null {
    return version;
  },
  get linkingUri(): string {
    // On native this is `exp://`
    return location.origin + location.pathname;
  },
  get expoRuntimeVersion(): string | null {
    return version;
  },
  get deviceName(): string | undefined {
    const { browser, engine, os: OS } = parser.getResult();

    return browser.name || engine.name || OS.name || undefined;
  },
  get nativeAppVersion(): null {
    return null;
  },
  get nativeBuildVersion(): null {
    return null;
  },
  get systemFonts(): string[] {
    // TODO: Bacon: Maybe possible.
    return [];
  },
  get statusBarHeight(): number {
    return 0;
  },
  get deviceYearClass(): number | null {
    // TODO: Bacon: The android version isn't very accurate either, maybe we could try and guess this value.
    return null;
  },
  get manifest(): WebManifest {
    return process.env.APP_MANIFEST || {};
  },
  get experienceUrl(): string {
    return location.origin + location.pathname;
  },
  get debugMode(): boolean {
    return process.env.NODE_ENV !== 'production';
  },
  async getWebViewUserAgentAsync(): Promise<string> {
    return navigator.userAgent;
  },
} as NativeConstants;
