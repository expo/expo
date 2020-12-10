import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { v4 as uuidv4 } from 'uuid';

import {
  ExecutionEnvironment,
  NativeConstants,
  PlatformManifest,
  WebManifest,
} from './Constants.types';

const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';

declare var __DEV__: boolean;
declare var process: { env: any };
declare var navigator: Navigator;
declare var location: Location;
declare var localStorage: Storage;

const _sessionId = uuidv4();

function getBrowserName(): string | undefined {
  if (canUseDOM) {
    const agent = navigator.userAgent.toLowerCase();
    if (agent.includes('edge')) {
      return 'Edge';
    } else if (agent.includes('edg')) {
      return 'Chromium Edge';
    } else if (agent.includes('opr') && !!window['opr']) {
      return 'Opera';
    } else if (agent.includes('chrome') && !!window['chrome']) {
      return 'Chrome';
    } else if (agent.includes('trident')) {
      return 'IE';
    } else if (agent.includes('firefox')) {
      return 'Firefox';
    } else if (agent.includes('safari')) {
      return 'Safari';
    }
  }

  return undefined;
}

export default {
  get name(): string {
    return 'ExponentConstants';
  },
  get appOwnership() {
    return null;
  },
  get executionEnvironment() {
    return ExecutionEnvironment.Bare;
  },
  get installationId(): string {
    let installationId;
    try {
      installationId = localStorage.getItem(ID_KEY);
      if (installationId == null || typeof installationId !== 'string') {
        installationId = uuidv4();
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
    return { web: canUseDOM ? { ua: navigator.userAgent } : undefined };
  },
  get isHeadless(): boolean {
    if (!canUseDOM) return true;

    return /\bHeadlessChrome\//.test(navigator.userAgent);
  },
  get isDevice(): true {
    // TODO: Bacon: Possibly want to add information regarding simulators
    return true;
  },
  get expoVersion(): string | null {
    return this.manifest.sdkVersion || null;
  },
  get linkingUri(): string {
    if (canUseDOM) {
      // On native this is `exp://`
      // On web we should use the protocol and hostname (location.origin)
      return location.origin;
    } else {
      return '';
    }
  },
  get expoRuntimeVersion(): string | null {
    return this.expoVersion;
  },
  get deviceName(): string | undefined {
    return getBrowserName();
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
    // This is defined by @expo/webpack-config.
    // If your site is bundled with a different config then you may not have access to the app.json automatically.
    return process.env.APP_MANIFEST || {};
  },
  get experienceUrl(): string {
    if (canUseDOM) {
      return location.origin;
    } else {
      return '';
    }
  },
  get debugMode(): boolean {
    return __DEV__;
  },
  async getWebViewUserAgentAsync(): Promise<string | null> {
    if (canUseDOM) {
      return navigator.userAgent;
    } else {
      return null;
    }
  },
} as NativeConstants;
