import { CodedError, Platform, Subscription } from 'expo-modules-core';

import { KeepAwakeEventState, KeepAwakeListener } from './KeepAwake.types';

const wakeLockMap: Record<string, WakeLockSentinel> = {};

type WakeLockSentinel = {
  onrelease: null | ((event: any) => void);
  released: boolean;
  type: 'screen';
  release?: Function;

  addEventListener?: (event: string, listener: (event: any) => void) => void;
  removeEventListener?: (event: string, listener: (event: any) => void) => void;
};

declare const navigator: {
  wakeLock: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
};

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
    const wakeLock = await navigator.wakeLock.request('screen');
    wakeLockMap[tag] = wakeLock;
  },
  async deactivate(tag: string) {
    if (!Platform.isDOMAvailable) {
      return;
    }
    if (wakeLockMap[tag]) {
      wakeLockMap[tag].release?.();
      delete wakeLockMap[tag];
    } else {
      throw new CodedError(
        'ERR_KEEP_AWAKE_TAG_INVALID',
        `The wake lock with tag ${tag} has not activated yet`
      );
    }
  },
  addListenerForTag(tag: string, listener: KeepAwakeListener): Subscription {
    const eventListener = () => {
      listener({ state: KeepAwakeEventState.RELEASE });
    };
    const sentinel = wakeLockMap[tag];
    if (sentinel) {
      if ('addEventListener' in sentinel) {
        sentinel.addEventListener?.('release', eventListener);
      } else {
        sentinel.onrelease = eventListener;
      }
    }
    return {
      remove: () => {
        const sentinel = wakeLockMap[tag];
        if (sentinel) {
          if (sentinel.removeEventListener) {
            sentinel.removeEventListener('release', eventListener);
          } else {
            sentinel.onrelease = null;
          }
        }
      },
    };
  },
};
