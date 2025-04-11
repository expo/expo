import { NativeModule, Platform, registerWebModule } from 'expo-modules-core';

import { getOrientationLockAsync, getOrientationAsync } from './ScreenOrientation';
import {
  Orientation,
  OrientationLock,
  WebOrientationLock,
  WebOrientation,
  ExpoOrientationEvents,
} from './ScreenOrientation.types';

const OrientationLockAPIToWeb: {
  [lock: string]: WebOrientationLock;
} = {
  [OrientationLock.DEFAULT]: WebOrientationLock.NATURAL,
  [OrientationLock.ALL]: WebOrientationLock.ANY,
  [OrientationLock.PORTRAIT]: WebOrientationLock.PORTRAIT,
  [OrientationLock.PORTRAIT_UP]: WebOrientationLock.PORTRAIT_PRIMARY,
  [OrientationLock.PORTRAIT_DOWN]: WebOrientationLock.PORTRAIT_SECONDARY,
  [OrientationLock.LANDSCAPE]: WebOrientationLock.LANDSCAPE,
  [OrientationLock.LANDSCAPE_LEFT]: WebOrientationLock.LANDSCAPE_PRIMARY,
  [OrientationLock.LANDSCAPE_RIGHT]: WebOrientationLock.LANDSCAPE_SECONDARY,
};

const OrientationWebToAPI: {
  [orientationWeb: string]: Orientation;
} = {
  [WebOrientation.PORTRAIT_PRIMARY]: Orientation.PORTRAIT_UP,
  [WebOrientation.PORTRAIT_SECONDARY]: Orientation.PORTRAIT_DOWN,
  [WebOrientation.LANDSCAPE_PRIMARY]: Orientation.LANDSCAPE_LEFT,
  [WebOrientation.LANDSCAPE_SECONDARY]: Orientation.LANDSCAPE_RIGHT,
};

declare const window: Window;

const screen: Screen = Platform.canUseViewport ? window.screen : ({} as Screen);

function _convertToLegacyOrientationLock(orientationLock: WebOrientationLock) {
  switch (orientationLock) {
    case WebOrientationLock.UNKNOWN:
      throw new Error(
        `expo-screen-orientation: WebOrientationLock.UNKNOWN is not a valid lock to be converted.`
      );
    case WebOrientationLock.ANY:
      return ['portrait', 'landscape'];
    case WebOrientationLock.NATURAL:
      return 'default';
    default:
      return orientationLock;
  }
}

declare global {
  interface Screen {
    msOrientation?: Screen['orientation']['type'];
    mozOrientation?: Screen['orientation'];

    mozUnlockOrientation?(): boolean | undefined;
    msUnlockOrientation?(): boolean | undefined;
    unlockOrientation?(): boolean | undefined;
  }
}

async function _lockAsync(webOrientationLock: WebOrientationLock): Promise<void> {
  if (webOrientationLock === WebOrientationLock.UNKNOWN) {
    throw new Error(
      `expo-screen-orientation: WebOrientationLock.UNKNOWN is not a valid lock that can be applied to the device.`
    );
  }

  // Handle modern lock screen web API
  // See: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
  if (
    screen.orientation &&
    'lock' in screen.orientation &&
    typeof screen.orientation.lock === 'function'
  ) {
    await screen.orientation.lock(webOrientationLock);
    return;
  }

  // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/lockOrientation
  const _legacyLockUniversal:
    | undefined
    | ((orientation: ReturnType<typeof _convertToLegacyOrientationLock>) => boolean) =
    // @ts-expect-error - These legacy APIs are removed from the types
    screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;

  // Fallback to outdated legacy web API
  // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/lockOrientation
  if (typeof _legacyLockUniversal === 'function') {
    const legacyLock = _convertToLegacyOrientationLock(webOrientationLock);
    const isSuccess = _legacyLockUniversal.call(screen, legacyLock);
    if (!isSuccess) {
      throw new Error(
        `Applying orientation lock: ${JSON.stringify(webOrientationLock)} to device was denied`
      );
    }
    return;
  }

  throw new Error(
    `expo-screen-orientation: The browser doesn't support locking screen orientation.`
  );
}

let _lastWebOrientationLock: WebOrientationLock = WebOrientationLock.UNKNOWN;

class ExpoScreenOrientation extends NativeModule<ExpoOrientationEvents> {
  orientation: ScreenOrientation | null = Platform.canUseViewport
    ? screen.orientation || (screen as any).msOrientation || null
    : null;
  async emitOrientationEvent() {
    const [orientationLock, orientation] = await Promise.all([
      getOrientationLockAsync(),
      getOrientationAsync(),
    ]);
    this.emit('expoDidUpdateDimensions', {
      orientationLock,
      orientationInfo: { orientation },
    });
  }
  startObserving() {
    this.listener = () => this.emitOrientationEvent();
    if (Platform.canUseEventListeners) {
      if (this.orientation && this.orientation.addEventListener) {
        this.orientation.addEventListener('change', this.listener);
      } else {
        window.addEventListener('orientationchange', this.listener);
      }
    }
  }
  stopObserving(): void {
    if (Platform.canUseEventListeners) {
      if (this.orientation && this.orientation.removeEventListener) {
        this.orientation.removeEventListener('change', this.listener);
      } else {
        window.removeEventListener('orientationchange', this.listener);
      }
    }
  }
  async supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean> {
    return orientationLock in OrientationLockAPIToWeb;
  }
  async getPlatformOrientationLockAsync(): Promise<WebOrientationLock> {
    return _lastWebOrientationLock;
  }
  async getOrientationAsync(): Promise<Orientation> {
    const webOrientation =
      screen['msOrientation'] || (screen.orientation || screen['mozOrientation'] || {}).type;
    if (!webOrientation) {
      return Orientation.UNKNOWN;
    }
    return OrientationWebToAPI[webOrientation];
  }
  async lockAsync(orientationLock: OrientationLock): Promise<void> {
    const webOrientationLock = OrientationLockAPIToWeb[orientationLock];
    if (!webOrientationLock) {
      throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
    }
    await _lockAsync(webOrientationLock);
  }
  async lockPlatformAsync(webOrientationLock: WebOrientationLock): Promise<void> {
    await _lockAsync(webOrientationLock);
    _lastWebOrientationLock = webOrientationLock;
  }
  async unlockAsync(): Promise<void> {
    // Handle modern lock screen web API
    // See: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/unlock
    if (
      screen.orientation &&
      'unlock' in screen.orientation &&
      typeof screen.orientation.unlock === 'function'
    ) {
      screen.orientation.unlock();
      return;
    }

    // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/unlockOrientation
    const _legacyUnlockUniversal: undefined | (() => boolean | undefined) =
      screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation;

    // Fallback to outdated legacy web API
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/unlockOrientation
    if (typeof _legacyUnlockUniversal === 'function') {
      const isSuccess = _legacyUnlockUniversal.call(screen);
      if (!isSuccess) {
        throw new Error(`Unlocking screen orientation on device was denied`);
      }
      return;
    }

    throw new Error(
      `expo-screen-orientation: The browser doesn't support unlocking screen orientation.`
    );
  }
}

export default registerWebModule(ExpoScreenOrientation, 'ExpoScreenOrientation');
