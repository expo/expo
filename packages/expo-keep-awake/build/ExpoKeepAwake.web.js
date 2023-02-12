import { CodedError, Platform } from 'expo-modules-core';
import { KeepAwakeEventState } from './KeepAwake.types';
const wakeLockMap = {};
/** Wraps the webWakeLock API https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API */
export default {
    async isAvailableAsync() {
        if (Platform.isDOMAvailable) {
            return 'wakeLock' in navigator;
        }
        return false;
    },
    async activate(tag) {
        if (!Platform.isDOMAvailable) {
            return;
        }
        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockMap[tag] = wakeLock;
    },
    async deactivate(tag) {
        if (!Platform.isDOMAvailable) {
            return;
        }
        if (wakeLockMap[tag]) {
            wakeLockMap[tag].release?.();
            delete wakeLockMap[tag];
        }
        else {
            throw new CodedError('ERR_KEEP_AWAKE_TAG_INVALID', `The wake lock with tag ${tag} has not activated yet`);
        }
    },
    addListenerForTag(tag, listener) {
        const eventListener = () => {
            listener({ state: KeepAwakeEventState.RELEASE });
        };
        const sentinel = wakeLockMap[tag];
        if (sentinel) {
            if ('addEventListener' in sentinel) {
                sentinel.addEventListener?.('release', eventListener);
            }
            else {
                sentinel.onrelease = eventListener;
            }
        }
        return {
            remove: () => {
                const sentinel = wakeLockMap[tag];
                if (sentinel) {
                    if (sentinel.removeEventListener) {
                        sentinel.removeEventListener('release', eventListener);
                    }
                    else {
                        sentinel.onrelease = null;
                    }
                }
            },
        };
    },
};
//# sourceMappingURL=ExpoKeepAwake.web.js.map