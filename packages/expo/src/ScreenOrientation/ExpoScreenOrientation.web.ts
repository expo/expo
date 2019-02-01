import { SyntheticPlatformEmitter } from 'expo-core';

import { OrientationInfo, OrientationLock } from './ScreenOrientation.types';

const WebOrientationLock = {
  any: 'ALL',
  portrait: 'PORTRAIT',
  'portrait-primary': 'PORTRAIT_UP',
  'portrait-secondary': 'PORTRAIT_DOWN',
  landscape: 'LANDSCAPE',
  'landscape-primary': 'LANDSCAPE_LEFT',
  'landscape-secondary': 'LANDSCAPE_RIGHT',
  natural: 'ALL_BUT_UPSIDE_DOWN',
};

const OrientationLockJSONToNative = {
  ALL: 'any',
  PORTRAIT: 'portrait',
  PORTRAIT_UP: 'portrait-primary',
  PORTRAIT_DOWN: 'portrait-secondary',
  LANDSCAPE: 'landscape',
  LANDSCAPE_LEFT: 'landscape-primary',
  LANDSCAPE_RIGHT: 'landscape-secondary',
  ALL_BUT_UPSIDE_DOWN: 'natural',
};

const OrientationAngleJSONToNative = {
  '0': 'portrait-primary',
  '180': 'portrait-secondary',
  '-180': 'portrait-secondary',
  '90': 'landscape-primary',
  '-90': 'landscape-secondary',
  '270': 'landscape-secondary',
};

declare const window: Window;

const { screen } = window;

const OrientationTarget: ScreenOrientation =
  screen['msOrientation'] || (screen.orientation || screen['mozOrientation']);

function emitOrientationEvent() {
  SyntheticPlatformEmitter.emit('didUpdateDimensions', {});
}

if (OrientationTarget) {
  OrientationTarget.onchange = emitOrientationEvent;
} else {
  window.onorientationchange = emitOrientationEvent;
}

export default {
  get name(): string {
    return 'ExpoScreenOrientation';
  },
  async doesSupportAsync(): Promise<boolean> {
    return OrientationTarget !== undefined;
  },
  async supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean> {
    return await this.doesSupportAsync();
  },
  async getPlatformOrientationLockAsync(): Promise<number> {
    return parseInt(`${window.orientation}`);
  },
  async getOrientationLockAsync(): Promise<OrientationLock> {
    const nextOrientation = OrientationAngleJSONToNative[`${window.orientation}`];
    const orientation = WebOrientationLock[nextOrientation];
    return OrientationLock[orientation as OrientationLock];
  },
  async getOrientationAsync(): Promise<OrientationInfo> {
    const nextOrientation = OrientationAngleJSONToNative[`${window.orientation}`];
    const orientation = WebOrientationLock[nextOrientation];
    return {
      orientation,
    };
  },
  async lockAsync(orientationLock: OrientationLock): Promise<void> {
    if (!(await this.doesSupportAsync())) {
      throw new Error(
        `expo-screen-orientation: You're browser doesn't support locking screen orientation.`
      );
    }
    await OrientationTarget.lock(OrientationLockJSONToNative[orientationLock]);
  },
  async lockPlatformAsync(orientation: number): Promise<void> {
    if (!(await this.doesSupportAsync())) {
      throw new Error(
        `expo-screen-orientation: You're browser doesn't support locking screen orientation.`
      );
    }
    const nextOrientation = OrientationAngleJSONToNative[`${orientation}`];
    await OrientationTarget.lock(nextOrientation);
  },
  async unlockAsync(): Promise<void> {
    if (OrientationTarget) {
      OrientationTarget.unlock();
    }
  },
};
