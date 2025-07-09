import { NativeModule, Platform, registerWebModule } from 'expo-modules-core';
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
    // Handle modern lock screen web API
    // See: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
    if (screen.orientation &&
        'lock' in screen.orientation &&
        typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock(webOrientationLock);
        return;
    }
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/lockOrientation
    const _legacyLockUniversal = 
    // @ts-expect-error - These legacy APIs are removed from the types
    screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
    // Fallback to outdated legacy web API
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/lockOrientation
    if (typeof _legacyLockUniversal === 'function') {
        const legacyLock = _convertToLegacyOrientationLock(webOrientationLock);
        const isSuccess = _legacyLockUniversal.call(screen, legacyLock);
        if (!isSuccess) {
            throw new Error(`Applying orientation lock: ${JSON.stringify(webOrientationLock)} to device was denied`);
        }
        return;
    }
    throw new Error(`expo-screen-orientation: The browser doesn't support locking screen orientation.`);
}
let _lastWebOrientationLock = WebOrientationLock.UNKNOWN;
class ExpoScreenOrientation extends NativeModule {
    orientation = Platform.canUseViewport
        ? screen.orientation || screen.msOrientation || null
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
            }
            else {
                window.addEventListener('orientationchange', this.listener);
            }
        }
    }
    stopObserving() {
        if (Platform.canUseEventListeners) {
            if (this.orientation && this.orientation.removeEventListener) {
                this.orientation.removeEventListener('change', this.listener);
            }
            else {
                window.removeEventListener('orientationchange', this.listener);
            }
        }
    }
    async supportsOrientationLockAsync(orientationLock) {
        return orientationLock in OrientationLockAPIToWeb;
    }
    async getPlatformOrientationLockAsync() {
        return _lastWebOrientationLock;
    }
    async getOrientationAsync() {
        const webOrientation = screen['msOrientation'] || (screen.orientation || screen['mozOrientation'] || {}).type;
        if (!webOrientation) {
            return Orientation.UNKNOWN;
        }
        return OrientationWebToAPI[webOrientation];
    }
    async lockAsync(orientationLock) {
        const webOrientationLock = OrientationLockAPIToWeb[orientationLock];
        if (!webOrientationLock) {
            throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
        }
        await _lockAsync(webOrientationLock);
    }
    async lockPlatformAsync(webOrientationLock) {
        await _lockAsync(webOrientationLock);
        _lastWebOrientationLock = webOrientationLock;
    }
    async unlockAsync() {
        // Handle modern lock screen web API
        // See: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/unlock
        if (screen.orientation &&
            'unlock' in screen.orientation &&
            typeof screen.orientation.unlock === 'function') {
            screen.orientation.unlock();
            return;
        }
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/unlockOrientation
        const _legacyUnlockUniversal = screen.unlockOrientation || screen.mozUnlockOrientation || screen.msUnlockOrientation;
        // Fallback to outdated legacy web API
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Screen/unlockOrientation
        if (typeof _legacyUnlockUniversal === 'function') {
            const isSuccess = _legacyUnlockUniversal.call(screen);
            if (!isSuccess) {
                throw new Error(`Unlocking screen orientation on device was denied`);
            }
            return;
        }
        throw new Error(`expo-screen-orientation: The browser doesn't support unlocking screen orientation.`);
    }
}
export default registerWebModule(ExpoScreenOrientation, 'ExpoScreenOrientation');
//# sourceMappingURL=ExpoScreenOrientation.web.js.map