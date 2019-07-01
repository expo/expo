import ExpoDevice from './ExpoDevice';
import { deviceNamesByCode } from './DeviceNameByCode';
import { devicesWithNotch } from './DeviceWithNotchConst';
import { Platform, UnavailabilityError } from '@unimodules/core';
export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
let modelName;
if (Platform.OS === 'ios') {
    let deviceName;
    let deviceId = ExpoDevice.deviceId;
    if (deviceId) {
        deviceName = deviceNamesByCode[deviceId];
        if (!deviceName) {
            // Not found on database. At least guess main device type from string contents:
            if (deviceId.startsWith('iPod')) {
                deviceName = 'iPod Touch';
            }
            else if (deviceId.startsWith('iPad')) {
                deviceName = 'iPad';
            }
            else if (deviceId.startsWith('iPhone')) {
                deviceName = 'iPhone';
            }
            else if (deviceId.startsWith('AppleTV')) {
                deviceName = 'Apple TV';
            }
        }
    }
    modelName = deviceName;
}
else {
    modelName = ExpoDevice ? ExpoDevice.model : null;
}
export const model = modelName;
export const systemName = ExpoDevice ? ExpoDevice.systemName : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const uniqueId = ExpoDevice ? ExpoDevice.uniqueId : null;
export const isTablet = ExpoDevice ? ExpoDevice.isTablet : null;
export const deviceType = ExpoDevice ? ExpoDevice.deviceType : null;
export const deviceId = ExpoDevice ? ExpoDevice.deviceId : null;
export const supportedABIs = ExpoDevice ? ExpoDevice.supportedABIs : null;
export function hasNotch() {
    return devicesWithNotch.some(item => item.brand.toLowerCase() === ExpoDevice.brand.toLowerCase() &&
        item.model.toLowerCase() ===
            (Platform.OS === 'ios' ? modelName.toLowerCase() : ExpoDevice.model.toLowerCase()));
}
export async function getIpAddressAsync() {
    return await ExpoDevice.getIpAddressAsync();
}
export async function getMACAddressAsync(interfaceName) {
    if (Platform.OS === 'android') {
        return await ExpoDevice.getMACAddressAsync(interfaceName);
    }
    else {
        return await ExpoDevice.getMACAddressAsync();
    }
}
export async function isAirplaneModeEnabledAsync() {
    if (!ExpoDevice.isAirplaneModeEnabledAsync) {
        throw new UnavailabilityError('expo-device', 'isAirplaneModeEnabledAsync');
    }
    return await ExpoDevice.isAirplaneModeEnabledAsync();
}
export async function hasSystemFeatureAsync(feature) {
    if (!ExpoDevice.hasSystemFeatureAsync) {
        throw new UnavailabilityError('expo-device', 'hasSystemFeatureAsync');
    }
    return await ExpoDevice.hasSystemFeatureAsync(feature);
}
export async function hasLocalAuthenticationAsync() {
    return await ExpoDevice.hasLocalAuthenticationAsync();
}
export async function getUserAgentAsync() {
    return await ExpoDevice.getUserAgentAsync();
}
export async function getCarrierAsync() {
    return await ExpoDevice.getCarrierAsync();
}
export async function getSystemAvailableFeaturesAsync() {
    if (!ExpoDevice.getSystemAvailableFeaturesAsync) {
        throw new UnavailabilityError('expo-device', 'getSystemAvailableFeaturesAsync');
    }
    return await ExpoDevice.getSystemAvailableFeaturesAsync();
}
//# sourceMappingURL=Device.js.map