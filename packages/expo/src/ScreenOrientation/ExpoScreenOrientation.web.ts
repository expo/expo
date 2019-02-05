import { SyntheticPlatformEmitter } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

import { OrientationInfo, Orientation, OrientationLock } from './ScreenOrientation.types';

enum OrientationLockType {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  PORTRAIT = 'portrait',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
  LANDSCAPE = 'landscape',
  ANY = 'any',
  NATURAL = 'natural',
}

enum OrientationType {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
}

const OrientationLockAPIToWeb: {
  [lock: string]: OrientationLockType;
} = {
  DEFAULT: OrientationLockType.NATURAL,
  ALL: OrientationLockType.ANY,
  PORTRAIT: OrientationLockType.PORTRAIT,
  PORTRAIT_UP: OrientationLockType.PORTRAIT_PRIMARY,
  PORTRAIT_DOWN: OrientationLockType.PORTRAIT_SECONDARY,
  LANDSCAPE: OrientationLockType.LANDSCAPE,
  LANDSCAPE_LEFT: OrientationLockType.LANDSCAPE_PRIMARY,
  LANDSCAPE_RIGHT: OrientationLockType.LANDSCAPE_SECONDARY,
};

const OrientationAPIToWeb: {
  [orientationApi: string]: OrientationType | Array<OrientationType>;
} = {
  PORTRAIT: [OrientationType.PORTRAIT_PRIMARY, OrientationType.PORTRAIT_SECONDARY],
  PORTRAIT_UP: OrientationType.PORTRAIT_PRIMARY,
  PORTRAIT_DOWN: OrientationType.PORTRAIT_SECONDARY,
  LANDSCAPE: [OrientationType.LANDSCAPE_PRIMARY, OrientationType.LANDSCAPE_SECONDARY],
  LANDSCAPE_LEFT: OrientationType.LANDSCAPE_PRIMARY,
  LANDSCAPE_RIGHT: OrientationType.LANDSCAPE_SECONDARY,
};

const OrientationWebToAPI: {
  [orientationWeb: string]: Orientation;
} = {
  [OrientationType.PORTRAIT_PRIMARY]: Orientation.PORTRAIT_UP,
  [OrientationType.PORTRAIT_SECONDARY]: Orientation.PORTRAIT_DOWN,
  [OrientationType.LANDSCAPE_PRIMARY]: Orientation.LANDSCAPE_LEFT,
  [OrientationType.LANDSCAPE_SECONDARY]: Orientation.LANDSCAPE_RIGHT,
};

declare const window: Window;

const { screen } = window;
const orientation: ScreenOrientation | null =
  screen.orientation || (screen as any).msOrientation || null;

function emitOrientationEvent() {
  SyntheticPlatformEmitter.emit('didUpdateDimensions', {});
}

if (orientation) {
  orientation.onchange = emitOrientationEvent;
} else {
  window.onorientationchange = emitOrientationEvent;
}

async function _lockAsync(
  webOrientationParam: OrientationLockType | Array<OrientationLockType>
): Promise<void> {
  const lockOrientationFn =
    screen['lockOrientation'] || screen['mozLockOrientation'] || screen['msLockOrientation'];

  // Chrome has the lock function under screen.orientation.lock
  // https://stackoverflow.com/questions/42956350/screen-lockorientation-is-not-a-function#answer-42961058
  const lockOrientationFnNestedContext = screen.orientation && screen.orientation.lock;

  let isSuccess;
  // Nested context fn does not accept an array parameter, only single orientationLockTypes
  if (lockOrientationFnNestedContext && !Array.isArray(webOrientationParam)) {
    // correct `this` context must be passed in otherwise method call is disallowed by browser
    isSuccess = await lockOrientationFnNestedContext.call(screen.orientation, webOrientationParam);
  } else if (lockOrientationFn) {
    isSuccess = await lockOrientationFn.call(screen, webOrientationParam);
  } else {
    throw new Error(
      `expo-screen-orientation: The browser doesn't support locking screen orientation.`
    );
  }

  if (!isSuccess) {
    throw new Error(
      `Applying orientation lock: ${JSON.stringify(webOrientationParam)} to device was denied`
    );
  }
}

let _lastPlatformOrientationLock: Array<Orientation> = [Orientation.UNKNOWN];

export default {
  get name(): string {
    return 'ExpoScreenOrientation';
  },
  async supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean> {
    return orientationLock in OrientationLockAPIToWeb;
  },
  async getPlatformOrientationLockAsync(): Promise<Array<Orientation>> {
    return _lastPlatformOrientationLock;
  },
  async getOrientationAsync(): Promise<OrientationInfo> {
    const webOrientation =
      screen['msOrientation'] || (screen.orientation || screen['mozOrientation'] || {}).type;
    if (!webOrientation) {
      throw new Error(`getOrientationAsync isn't supported in this browser.`);
    }
    return {
      orientation: OrientationWebToAPI[webOrientation],
    };
  },
  async lockAsync(orientationLock: OrientationLock): Promise<void> {
    const webOrientationLock = OrientationLockAPIToWeb[orientationLock];
    if (!webOrientationLock) {
      throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
    }
    await _lockAsync(webOrientationLock);
  },
  async lockPlatformAsync(orientations: Array<Orientation>): Promise<void> {
    const orientationSet = new Set(); // used to remove duplicate orientation types
    for (let orientation of orientations) {
      const webOrientation = OrientationAPIToWeb[orientation];
      if (!webOrientation) {
        throw new TypeError(`Invalid Orientation: ${webOrientation}`);
      }

      // Add orientations to set
      Array.isArray(webOrientation)
        ? webOrientation.forEach(orientation => orientationSet.add(orientation))
        : orientationSet.add(webOrientation);
    }
    await _lockAsync(Array.from(orientationSet));
    _lastPlatformOrientationLock = orientations;
  },
  async unlockAsync(): Promise<void> {
    const unlockOrientationFn =
      screen['unlockOrientation'] ||
      screen['mozUnlockOrientation'] ||
      screen['msUnlockOrientation'];
    const unlockOrientationFnNestedContext = screen.orientation && screen.orientation.unlock;

    if (!unlockOrientationFn && !unlockOrientationFnNestedContext) {
      throw new Error(
        `expo-screen-orientation: The browser doesn't support unlocking screen orientation.`
      );
    }

    let isSuccess;
    if (unlockOrientationFnNestedContext) {
      isSuccess = await unlockOrientationFnNestedContext.call(screen.orientation);
    } else {
      isSuccess = await unlockOrientationFn.call(screen);
    }

    if (!isSuccess) {
      throw new Error(`Unlocking screen orientation on device was denied`);
    }
  },
};
