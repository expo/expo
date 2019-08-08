import { Platform } from 'react-native';
import { NativeModulesProxy } from '@unimodules/core';
export var BrightnessMode;
(function (BrightnessMode) {
    BrightnessMode[BrightnessMode["UNKNOWN"] = 0] = "UNKNOWN";
    BrightnessMode[BrightnessMode["AUTOMATIC"] = 1] = "AUTOMATIC";
    BrightnessMode[BrightnessMode["MANUAL"] = 2] = "MANUAL";
})(BrightnessMode || (BrightnessMode = {}));
;
export async function getBrightnessAsync() {
    return await NativeModulesProxy.ExpoBrightness.getBrightnessAsync();
}
export async function setBrightnessAsync(brightnessValue) {
    let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
    if (isNaN(clampedBrightnessValue)) {
        throw new TypeError(`setBrightnessAsync cannot be called with ${brightnessValue}`);
    }
    return await NativeModulesProxy.ExpoBrightness.setBrightnessAsync(clampedBrightnessValue);
}
export async function getSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return await getBrightnessAsync();
    }
    return await NativeModulesProxy.ExpoBrightness.getSystemBrightnessAsync();
}
export async function setSystemBrightnessAsync(brightnessValue) {
    let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
    if (isNaN(clampedBrightnessValue)) {
        throw new TypeError(`setSystemBrightnessAsync cannot be called with ${brightnessValue}`);
    }
    if (Platform.OS !== 'android') {
        return await setBrightnessAsync(clampedBrightnessValue);
    }
    return await NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync(clampedBrightnessValue);
}
export async function useSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return;
    }
    return await NativeModulesProxy.ExpoBrightness.useSystemBrightnessAsync();
}
export async function isUsingSystemBrightnessAsync() {
    if (Platform.OS !== 'android') {
        return false;
    }
    return await NativeModulesProxy.ExpoBrightness.isUsingSystemBrightnessAsync();
}
export async function getSystemBrightnessModeAsync() {
    if (Platform.OS !== 'android') {
        return BrightnessMode.UNKNOWN;
    }
    return await NativeModulesProxy.ExpoBrightness.getSystemBrightnessModeAsync();
}
export async function setSystemBrightnessModeAsync(brightnessMode) {
    if (Platform.OS !== 'android' || brightnessMode === BrightnessMode.UNKNOWN) {
        return;
    }
    return await NativeModulesProxy.ExpoBrightness.setSystemBrightnessModeAsync(brightnessMode);
}
//# sourceMappingURL=Brightness.js.map