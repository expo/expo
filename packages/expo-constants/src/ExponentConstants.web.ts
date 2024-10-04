import {
  ExecutionEnvironment,
  NativeConstants,
  PlatformManifest,
  WebManifest,
} from './Constants.types';

const ID_KEY = 'EXPO_CONSTANTS_INSTALLATION_ID';

declare let __DEV__: boolean;
declare let process: { env: any };
declare let navigator: Navigator;
declare let location: Location;
declare let localStorage: Storage;

const _sessionId = (Date.now() + '-' + Math.floor(Math.random() * 1000000000)).toString();

function getBrowserName(): string | undefined {
  if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') {
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
        installationId = (Date.now() + '-' + Math.floor(Math.random() * 1000000000)).toString();
        localStorage.setItem(ID_KEY, installationId as string);
      }
    } catch {
      installationId = _sessionId;
    } finally {
      return installationId;
    }
  },
  get sessionId(): string {
    return _sessionId;
  },
  get platform(): PlatformManifest {
    return { web: typeof navigator !== 'undefined' ? { ua: navigator.userAgent } : undefined };
  },
  get isHeadless(): boolean {
    if (typeof navigator === 'undefined') return true;

    return /\bHeadlessChrome\//.test(navigator.userAgent);
  },
  get isDevice(): true {
    // TODO: Bacon: Possibly want to add information regarding simulators
    return true;
  },
  get expoVersion(): string | null {
    return (this.manifest as any)!.sdkVersion || null;
  },
  get linkingUri(): string {
    if (typeof location !== 'undefined') {
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
    // This is defined by @expo/webpack-config or babel-preset-expo.
    // If your site is bundled with a different config then you may not have access to the app.json automatically.
    return process.env.APP_MANIFEST || {};
  },
  get manifest2(): null {
    return null;
  },
  get experienceUrl(): string {
    if (typeof location !== 'undefined') {
      return location.origin;
    } else {
      return '';
    }
  },
  get debugMode(): boolean {
    return __DEV__;
  },
  async getWebViewUserAgentAsync(): Promise<string | null> {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    } else {
      return null;
    }
  },
} as NativeConstants;
