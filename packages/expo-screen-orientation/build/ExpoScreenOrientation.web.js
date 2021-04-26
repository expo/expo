import { SyntheticPlatformEmitter, Platform } from '@unimodules/core';
import { getOrientationLockAsync, getOrientationAsync } from './ScreenOrientation';
import { Orientation, OrientationLock, WebOrientationLock, WebOrientation, } from './ScreenOrientation.types';
const OrientationLockAPIToWeb = {
    [OrientationLock.DEFAULT]: WebOrientationLock.NATURAL,
    [OrientationLock.ALL]: WebOrientationLock.ANY,
    [OrientationLock.PORTRAIT]: WebOrientationLock.PORTRAIT,
    [OrientationLock.PORTRAIT_UP]: WebOrientationLock.PORTRAIT_PRIMARY,
    [OrientationLock.PORTRAIT_DOWN]: WebOrientationLock.PORTRAIT_SECONDARY,
    [OrientationLock.LANDSCAPE]: WebOrientationLock.LANDSCAPE,
    [OrientationLock.LANDSCAPE_LEFT]: WebOrientationLock.LANDSCAPE_PRIMARY,
    [OrientationLock.LANDSCAPE_RIGHT]: WebOrientationLock.LANDSCAPE_SECONDARY,
};
const OrientationWebToAPI = {
    [WebOrientation.PORTRAIT_PRIMARY]: Orientation.PORTRAIT_UP,
    [WebOrientation.PORTRAIT_SECONDARY]: Orientation.PORTRAIT_DOWN,
    [WebOrientation.LANDSCAPE_PRIMARY]: Orientation.LANDSCAPE_LEFT,
    [WebOrientation.LANDSCAPE_SECONDARY]: Orientation.LANDSCAPE_RIGHT,
};
const screen = Platform.canUseViewport ? window.screen : {};
const orientation = Platform.canUseViewport
    ? screen.orientation || screen.msOrientation || null
    : null;
async function emitOrientationEvent() {
    const [orientationLock, orientation] = await Promise.all([
        getOrientationLockAsync(),
        getOrientationAsync(),
    ]);
    SyntheticPlatformEmitter.emit('expoDidUpdateDimensions', {
        orientationLock,
        orientationInfo: { orientation },
    });
}
if (Platform.canUseEventListeners) {
    if (orientation && orientation.addEventListener) {
        orientation.addEventListener('change', emitOrientationEvent);
    }
    else {
        window.addEventListener('orientationchange', emitOrientationEvent);
    }
}
function _convertToLegacyOrientationLock(orientationLock) {
    switch (orientationLock) {
        case WebOrientationLock.UNKNOWN:
            throw new Error(`expo-screen-orientation: WebOrientationLock.UNKNOWN is not a valid lock to be converted.`);
        case WebOrientationLock.ANY:
            return ['portrait', 'landscape'];
        case WebOrientationLock.NATURAL:
            return 'default';
        default:
            return orientationLock;
    }
}
async function _lockAsync(webOrientationLock) {
    if (webOrientationLock === WebOrientationLock.UNKNOWN) {
        throw new Error(`expo-screen-orientation: WebOrientationLock.UNKNOWN is not a valid lock that can be applied to the device.`);
    }
    if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock(webOrientationLock);
    }
    else if (screen['lockOrientation'] ||
        screen['mozLockOrientation'] ||
        screen['msLockOrientation']) {
        const legacyLock = _convertToLegacyOrientationLock(webOrientationLock);
        const lockOrientation = screen['lockOrientation'] || screen['mozLockOrientation'] || screen['msLockOrientation'];
        // correct `this` context must be passed in otherwise method call is disallowed by browser
        const isSuccess = lockOrientation.call(screen, legacyLock);
        if (!isSuccess) {
            throw new Error(`Applying orientation lock: ${JSON.stringify(webOrientationLock)} to device was denied`);
        }
    }
    else {
        throw new Error(`expo-screen-orientation: The browser doesn't support locking screen orientation.`);
    }
}
let _lastWebOrientationLock = WebOrientationLock.UNKNOWN;
export default {
    get name() {
        return 'ExpoScreenOrientation';
    },
    async supportsOrientationLockAsync(orientationLock) {
        return orientationLock in OrientationLockAPIToWeb;
    },
    async getPlatformOrientationLockAsync() {
        return _lastWebOrientationLock;
    },
    async getOrientationAsync() {
        const webOrientation = screen['msOrientation'] || (screen.orientation || screen['mozOrientation'] || {}).type;
        if (!webOrientation) {
            return Orientation.UNKNOWN;
        }
        return OrientationWebToAPI[webOrientation];
    },
    async lockAsync(orientationLock) {
        const webOrientationLock = OrientationLockAPIToWeb[orientationLock];
        if (!webOrientationLock) {
            throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
        }
        await _lockAsync(webOrientationLock);
    },
    async lockPlatformAsync(webOrientationLock) {
        await _lockAsync(webOrientationLock);
        _lastWebOrientationLock = webOrientationLock;
    },
    async unlockAsync() {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
        else if (screen['unlockOrientation'] ||
            screen['mozUnlockOrientation'] ||
            screen['msUnlockOrientation']) {
            const unlockOrientation = screen['unlockOrientation'] ||
                screen['mozUnlockOrientation'] ||
                screen['msUnlockOrientation'];
            // correct `this` context must be passed in otherwise method call is disallowed by browser
            const isSuccess = unlockOrientation.call(screen);
            if (!isSuccess) {
                throw new Error(`Unlocking screen orientation on device was denied`);
            }
        }
        else {
            throw new Error(`expo-screen-orientation: The browser doesn't support unlocking screen orientation.`);
        }
    },
};
//# sourceMappingURL=ExpoScreenOrientation.web.js.map