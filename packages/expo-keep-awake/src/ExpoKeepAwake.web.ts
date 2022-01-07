import { CodedError, Platform, Subscription } from 'expo-modules-core';

import { KeepAwakeEvent, KeepAwakeEventState } from './KeepAwake.types';

const wakeLockMap: Record<string, any> = {};

/** Wraps the webWakeLock API https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API */
export default {
  async isAvailableAsync() {
    if (Platform.isDOMAvailable) {
      return 'wakeLock' in navigator;
    }
    return false;
  },
  async activate(tag: string) {
    if (!Platform.isDOMAvailable) {
      return;
    }
    const wakeLock = await (navigator as any).wakeLock.request('screen');
    wakeLockMap[tag] = wakeLock;
  },
  async deactivate(tag: string) {
    if (!Platform.isDOMAvailable) {
      return;
    }
    if (wakeLockMap[tag]) {
      wakeLockMap[tag].release();
      wakeLockMap[tag] = null;
    } else {
      throw new CodedError(
        'ERR_KEEP_AWAKE_TAG_INVALID',
        `The wake lock with tag ${tag} has not activated yet`
      );
    }
  },
  addListener(tag: string, listener: (event: KeepAwakeEvent) => void): Subscription {
    const eventListener = () => {
      listener({ state: KeepAwakeEventState.RELEASE });
    };
    if (wakeLockMap[tag]) {
      wakeLockMap[tag].addEventListener('release', eventListener);
    }
    return {
      remove: () => {
        if (wakeLockMap[tag]) {
          wakeLockMap[tag].removeEventListener('release', eventListener);
        }
      },
    };
  },
};
