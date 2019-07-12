import { EventEmitter, Platform, UnavailabilityError } from '@unimodules/core';
import ExpoScreenOrientation from './ExpoScreenOrientation';
import { Orientation, OrientationLock, SizeClassIOS, WebOrientationLock, } from './ScreenOrientation.types';
export { Orientation, OrientationLock, SizeClassIOS, WebOrientationLock, };
const _orientationChangeEmitter = new EventEmitter(ExpoScreenOrientation);
let _orientationChangeSubscribers = [];
let _lastOrientationLock = OrientationLock.UNKNOWN;
export function allow(orientationLock) {
    console.warn("'ScreenOrientation.allow' is deprecated in favour of 'ScreenOrientation.lockAsync' and will be removed in SDK 35 or later");
    lockAsync(orientationLock);
}
export async function allowAsync(orientationLock) {
    console.warn("'ScreenOrientation.allowAsync' is deprecated in favour of 'ScreenOrientation.lockAsync'");
    await lockAsync(orientationLock);
}
export async function lockAsync(orientationLock) {
    if (!ExpoScreenOrientation.lockAsync) {
        throw new UnavailabilityError('ScreenOrientation', 'lockAsync');
    }
    const orientationLocks = Object.values(OrientationLock);
    if (!orientationLocks.includes(orientationLock)) {
        throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
    }
    if (orientationLock === OrientationLock.OTHER) {
        return;
    }
    await ExpoScreenOrientation.lockAsync(orientationLock);
    _lastOrientationLock = orientationLock;
}
export async function lockPlatformAsync(options) {
    if (!ExpoScreenOrientation.lockPlatformAsync) {
        throw new UnavailabilityError('ScreenOrientation', 'lockPlatformAsync');
    }
    const { screenOrientationConstantAndroid, screenOrientationArrayIOS, screenOrientationLockWeb, } = options;
    let platformOrientationParam;
    if (Platform.OS === 'android' && screenOrientationConstantAndroid) {
        if (isNaN(screenOrientationConstantAndroid)) {
            throw new TypeError(`lockPlatformAsync Android platform: screenOrientationConstantAndroid cannot be called with ${screenOrientationConstantAndroid}`);
        }
        platformOrientationParam = screenOrientationConstantAndroid;
    }
    else if (Platform.OS === 'ios' && screenOrientationArrayIOS) {
        if (!Array.isArray(screenOrientationArrayIOS)) {
            throw new TypeError(`lockPlatformAsync iOS platform: screenOrientationArrayIOS cannot be called with ${screenOrientationArrayIOS}`);
        }
        const orientations = Object.values(Orientation);
        for (let orientation of screenOrientationArrayIOS) {
            if (!orientations.includes(orientation)) {
                throw new TypeError(`lockPlatformAsync iOS platform: ${orientation} is not a valid Orientation`);
            }
        }
        platformOrientationParam = screenOrientationArrayIOS;
    }
    else if (Platform.OS === 'web' && screenOrientationLockWeb) {
        const webOrientationLocks = Object.values(WebOrientationLock);
        if (!webOrientationLocks.includes(screenOrientationLockWeb)) {
            throw new TypeError(`Invalid Web Orientation Lock: ${screenOrientationLockWeb}`);
        }
        platformOrientationParam = screenOrientationLockWeb;
    }
    if (!platformOrientationParam) {
        throw new TypeError('lockPlatformAsync cannot be called with undefined option properties');
    }
    await ExpoScreenOrientation.lockPlatformAsync(platformOrientationParam);
    _lastOrientationLock = OrientationLock.OTHER;
}
export async function unlockAsync() {
    if (!ExpoScreenOrientation.unlockAsync) {
        throw new UnavailabilityError('ScreenOrientation', 'unlockAsync');
    }
    await ExpoScreenOrientation.unlockAsync();
}
export async function getOrientationAsync() {
    if (!ExpoScreenOrientation.getOrientationAsync) {
        throw new UnavailabilityError('ScreenOrientation', 'getOrientationAsync');
    }
    return await ExpoScreenOrientation.getOrientationAsync();
}
export async function getOrientationLockAsync() {
    if (!ExpoScreenOrientation.getOrientationLockAsync) {
        return _lastOrientationLock;
    }
    return await ExpoScreenOrientation.getOrientationLockAsync();
}
export async function getPlatformOrientationLockAsync() {
    const platformOrientationLock = await ExpoScreenOrientation.getPlatformOrientationLockAsync();
    if (Platform.OS === 'android') {
        return {
            screenOrientationConstantAndroid: platformOrientationLock,
        };
    }
    else if (Platform.OS === 'ios') {
        return {
            screenOrientationArrayIOS: platformOrientationLock,
        };
    }
    else if (Platform.OS === 'web') {
        return {
            screenOrientationLockWeb: platformOrientationLock,
        };
    }
    else {
        return {};
    }
}
export async function supportsOrientationLockAsync(orientationLock) {
    if (!ExpoScreenOrientation.supportsOrientationLockAsync) {
        throw new UnavailabilityError('ScreenOrientation', 'supportsOrientationLockAsync');
    }
    const orientationLocks = Object.values(OrientationLock);
    if (!orientationLocks.includes(orientationLock)) {
        throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
    }
    return await ExpoScreenOrientation.supportsOrientationLockAsync(orientationLock);
}
export async function doesSupportAsync(orientationLock) {
    console.warn("'ScreenOrientation.doesSupportAsync' is deprecated in favour of 'ScreenOrientation.supportsOrientationLockAsync'");
    return await supportsOrientationLockAsync(orientationLock);
}
// Determine the event name lazily so Jest can set up mocks in advance
function getEventName() {
    return Platform.OS === 'ios' || Platform.OS === 'web'
        ? 'expoDidUpdateDimensions'
        : 'didUpdateDimensions';
}
// We rely on RN to emit `didUpdateDimensions`
// If this method no longer works, it's possible that the underlying RN implementation has changed
// see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
export function addOrientationChangeListener(listener) {
    if (typeof listener !== 'function') {
        throw new TypeError(`addOrientationChangeListener cannot be called with ${listener}`);
    }
    const subscription = _orientationChangeEmitter.addListener(getEventName(), async (update) => {
        let orientationInfo, orientationLock;
        if (Platform.OS === 'ios' || Platform.OS === 'web') {
            // For iOS, RN relies on statusBarOrientation (deprecated) to emit `didUpdateDimensions` event, so we emit our own `expoDidUpdateDimensions` event instead
            orientationLock = update.orientationLock;
            orientationInfo = update.orientationInfo;
        }
        else {
            // We rely on the RN Dimensions to emit the `didUpdateDimensions` event on Android
            [orientationLock, orientationInfo] = await Promise.all([
                getOrientationLockAsync(),
                getOrientationAsync(),
            ]);
        }
        listener({ orientationInfo, orientationLock });
    });
    _orientationChangeSubscribers.push(subscription);
    return subscription;
}
// We need to keep track of our own subscribers because EventEmitter uses a shared subscriber
// from NativeEventEmitter that is registered to the same eventTypes as us. Directly calling
// removeAllListeners(eventName) will remove other module's subscribers.
export function removeOrientationChangeListeners() {
    // Remove listener by subscription instead of eventType to avoid clobbering Dimension module's subscription of didUpdateDimensions
    let i = _orientationChangeSubscribers.length;
    while (i--) {
        const subscriber = _orientationChangeSubscribers[i];
        subscriber.remove();
        // remove after a successful unsubscribe
        _orientationChangeSubscribers.pop();
    }
}
export function removeOrientationChangeListener(subscription) {
    if (!subscription || !subscription.remove) {
        throw new TypeError(`Must pass in a valid subscription`);
    }
    subscription.remove();
    _orientationChangeSubscribers = _orientationChangeSubscribers.filter(sub => sub !== subscription);
}
//# sourceMappingURL=ScreenOrientation.js.map