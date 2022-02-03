import { PermissionStatus, Platform } from 'expo-modules-core';
export async function getPermissionsAsync() {
    // We can infer from the requestor if this is an older browser.
    const status = getRequestPermission()
        ? PermissionStatus.UNDETERMINED
        : isIOS()
            ? PermissionStatus.DENIED
            : PermissionStatus.GRANTED;
    return {
        status,
        expires: 'never',
        canAskAgain: true,
        granted: status === PermissionStatus.GRANTED,
    };
}
export async function requestPermissionsAsync() {
    const status = await askSensorPermissionAsync();
    return {
        status,
        expires: 'never',
        granted: status === PermissionStatus.GRANTED,
        canAskAgain: false,
    };
}
async function askSensorPermissionAsync() {
    const requestPermission = getRequestPermission();
    // Technically this is incorrect because it doesn't account for iOS 12.2 Safari.
    // But unfortunately we can only abstract so much.
    if (!requestPermission)
        return PermissionStatus.GRANTED;
    // If this isn't invoked in a touch-event then it never resolves.
    // Safari probably should throw an error but because it doesn't we have no way of informing the developer.
    const status = await requestPermission();
    switch (status) {
        case 'granted':
            return PermissionStatus.GRANTED;
        case 'denied':
            return PermissionStatus.DENIED;
        default:
            return PermissionStatus.UNDETERMINED;
    }
}
export function getRequestPermission() {
    if (!Platform.isDOMAvailable) {
        return null;
    }
    if (typeof DeviceMotionEvent !== 'undefined' && !!DeviceMotionEvent?.requestPermission) {
        return DeviceMotionEvent.requestPermission;
    }
    else if (typeof DeviceOrientationEvent !== 'undefined' &&
        !!DeviceOrientationEvent?.requestPermission) {
        return DeviceOrientationEvent.requestPermission;
    }
    return null;
}
class PermissionError extends Error {
    constructor(eventName) {
        let errorMessage = `Cannot observe event: ${eventName}. How to fix:`;
        errorMessage += `\n- Ensure you've requested the \`MOTION\` permission via expo-permissions (this must be done in a touch event).`;
        if (location.protocol !== 'https:') {
            errorMessage +=
                '\n- Ensure that you are hosting with `https` as DeviceMotion and DeviceOrientation are now secure APIs.';
        }
        // is iOS and doesn't support requesting permissions, must be 12.2
        if (isIOS() && !getRequestPermission()) {
            errorMessage +=
                '\n- On iOS 12.2, you must manually enable device orientation in `Settings > Safari > Motion & Orientation Access`.';
        }
        super(errorMessage);
    }
}
// iOS 12.2 disables DeviceMotion by default now
// https://github.com/w3c/deviceorientation/issues/57
export async function assertSensorEventEnabledAsync(eventName, timeout) {
    if (!Platform.isDOMAvailable) {
        return false;
    }
    if (getRequestPermission()) {
        if (await isSensorEnabledAsync(eventName, timeout)) {
            return true;
        }
        throw new PermissionError(eventName);
    }
    return true;
}
// throw error if the sensor is disabled.
export async function isSensorEnabledAsync(eventName, 
// Initial interval tests found results on a median of
// devicemotion:
// - iPhone 7 Plus: 166.6666753590107ms
// - iPhone X: 166.6666753590107ms
// deviceorientation:
// -
//
// The initial launch of iOS Safari onto a page calling this API seems to take a little longer than a regular call.
// devicemotion:
// - ~35ms
// deviceorientation:
// - ~45ms
//
timeout = 250) {
    if (!Platform.isDOMAvailable) {
        return false;
    }
    // If there is no method to request permission then the device has access to device motion.
    // Older versions of iOS have no method but still disable motion so we should always check on iOS.
    if (!isIOS && !getRequestPermission()) {
        return true;
    }
    return new Promise((resolve) => {
        const id = setTimeout(() => {
            window.removeEventListener(eventName, listener);
            resolve(false);
        }, timeout);
        const listener = () => {
            clearTimeout(id);
            window.removeEventListener(eventName, listener);
            resolve(true);
        };
        window.addEventListener(eventName, listener);
    });
}
// https://stackoverflow.com/a/9039885/4047926
function isIOS() {
    const isIOSUA = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    const isIE11 = !!window['MSStream'];
    return isIOSUA && !isIE11;
}
//# sourceMappingURL=isSensorEnabledAsync.web.js.map