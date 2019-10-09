import { Platform } from 'react-native';
import { UnavailabilityError } from '@unimodules/core';
import ExpoBrightness from './ExpoBrightness';
export var BrightnessMode;
(function (BrightnessMode) {
    BrightnessMode[BrightnessMode["UNKNOWN"] = 0] = "UNKNOWN";
    BrightnessMode[BrightnessMode["AUTOMATIC"] = 1] = "AUTOMATIC";
    BrightnessMode[BrightnessMode["MANUAL"] = 2] = "MANUAL";
})(BrightnessMode || (BrightnessMode = {}));
export const PermissionsStatus = {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
};
export async function getBrightnessAsync() {
    if (!ExpoBrightness.getBrightnessAsync) {
        throw new UnavailabilityError('expo-brightness', 'getBrightnessAsync');
    }
    return await ExpoBrightness.getBrightnessAsync();
}
export async function setBrightnessAsync(brightnessValue) {
    if (!ExpoBrightness.setBrightnessAsync) {
        throw new UnavailabilityError('expo-brightness', 'setBrightnessAsync');
    }
    let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
    if (isNaN(clampedBrightnessValue)) {
        throw new TypeError(`setBrightnessAsync cannot be called with ${brightnessValue}`);
    }
    return await ExpoBrightness.setBrightnessAsync(clampedBrightnessValue);
}
export async function getSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return await getBrightnessAsync();
    }
    return await ExpoBrightness.getSystemBrightnessAsync();
}
export async function setSystemBrightnessAsync(brightnessValue) {
    let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
    if (isNaN(clampedBrightnessValue)) {
        throw new TypeError(`setSystemBrightnessAsync cannot be called with ${brightnessValue}`);
    }
    if (Platform.OS !== 'android') {
        return await setBrightnessAsync(clampedBrightnessValue);
    }
    return await ExpoBrightness.setSystemBrightnessAsync(clampedBrightnessValue);
}
export async function useSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return;
    }
    return await ExpoBrightness.useSystemBrightnessAsync();
}
export async function isUsingSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return false;
    }
    return await ExpoBrightness.isUsingSystemBrightnessAsync();
}
export async function getSystemBrightnessModeAsync() {
    if (Platform.OS !== 'android') {
        return BrightnessMode.UNKNOWN;
    }
    return await ExpoBrightness.getSystemBrightnessModeAsync();
}
export async function setSystemBrightnessModeAsync(brightnessMode) {
    if (Platform.OS !== 'android' || brightnessMode === BrightnessMode.UNKNOWN) {
        return;
    }
    return await ExpoBrightness.setSystemBrightnessModeAsync(brightnessMode);
}
export async function getPermissionsAsync() {
    return ExpoBrightness.getPermissionsAsync();
}
export async function requestPermissionsAsync() {
    return ExpoBrightness.requestPermissionsAsync();
}
//# sourceMappingURL=Brightness.js.map