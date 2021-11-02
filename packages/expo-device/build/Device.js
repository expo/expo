import { UnavailabilityError } from 'expo-modules-core';
import { DeviceType } from './Device.types';
import ExpoDevice from './ExpoDevice';
export { DeviceType };
export const isDevice = ExpoDevice ? ExpoDevice.isDevice : true;
export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
export const modelId = ExpoDevice ? ExpoDevice.modelId || null : null;
export const modelName = ExpoDevice ? ExpoDevice.modelName : null;
export const designName = ExpoDevice ? ExpoDevice.designName || null : null;
export const productName = ExpoDevice ? ExpoDevice.productName || null : null;
export const deviceYearClass = ExpoDevice ? ExpoDevice.deviceYearClass : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const supportedCpuArchitectures = ExpoDevice
    ? ExpoDevice.supportedCpuArchitectures
    : null;
export const osName = ExpoDevice ? ExpoDevice.osName : null;
export const osVersion = ExpoDevice ? ExpoDevice.osVersion : null;
export const osBuildId = ExpoDevice ? ExpoDevice.osBuildId : null;
export const osInternalBuildId = ExpoDevice ? ExpoDevice.osInternalBuildId : null;
export const osBuildFingerprint = ExpoDevice
    ? ExpoDevice.osBuildFingerprint || null
    : null;
export const platformApiLevel = ExpoDevice
    ? ExpoDevice.platformApiLevel || null
    : null;
export const deviceName = ExpoDevice ? ExpoDevice.deviceName : null;
export async function getDeviceTypeAsync() {
    if (!ExpoDevice.getDeviceTypeAsync) {
        throw new UnavailabilityError('expo-device', 'getDeviceTypeAsync');
    }
    return await ExpoDevice.getDeviceTypeAsync();
}
export async function getUptimeAsync() {
    if (!ExpoDevice.getUptimeAsync) {
        throw new UnavailabilityError('expo-device', 'getUptimeAsync');
    }
    return await ExpoDevice.getUptimeAsync();
}
export async function getMaxMemoryAsync() {
    if (!ExpoDevice.getMaxMemoryAsync) {
        throw new UnavailabilityError('expo-device', 'getMaxMemoryAsync');
    }
    let maxMemory = await ExpoDevice.getMaxMemoryAsync();
    if (maxMemory === -1) {
        maxMemory = Number.MAX_SAFE_INTEGER;
    }
    return maxMemory;
}
export async function isRootedExperimentalAsync() {
    if (!ExpoDevice.isRootedExperimentalAsync) {
        throw new UnavailabilityError('expo-device', 'isRootedExperimentalAsync');
    }
    return await ExpoDevice.isRootedExperimentalAsync();
}
export async function isSideLoadingEnabledAsync() {
    if (!ExpoDevice.isSideLoadingEnabledAsync) {
        throw new UnavailabilityError('expo-device', 'isSideLoadingEnabledAsync');
    }
    return await ExpoDevice.isSideLoadingEnabledAsync();
}
export async function getPlatformFeaturesAsync() {
    if (!ExpoDevice.getPlatformFeaturesAsync) {
        return [];
    }
    return await ExpoDevice.getPlatformFeaturesAsync();
}
export async function hasPlatformFeatureAsync(feature) {
    if (!ExpoDevice.hasPlatformFeatureAsync) {
        return false;
    }
    return await ExpoDevice.hasPlatformFeatureAsync(feature);
}
//# sourceMappingURL=Device.js.map