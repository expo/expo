import { UnavailabilityError, EventEmitter } from '@unimodules/core';
import ExpoBattery from './ExpoBattery';
const BatteryEventEmitter = new EventEmitter(ExpoBattery);
export async function getBatteryLevelAsync() {
    if (!ExpoBattery.getBatteryLevelAsync) {
        throw new UnavailabilityError('expo-battery', 'getBatteryLevelAsync');
    }
    return await ExpoBattery.getBatteryLevelAsync();
}
export async function getBatteryStateAsync() {
    if (!ExpoBattery.getBatteryStateAsync) {
        throw new UnavailabilityError('expo-battery', 'getBatteryStateAsync');
    }
    return await ExpoBattery.getBatteryStateAsync();
}
export async function isLowPowerModeEnabledAsync() {
    if (!ExpoBattery.isLowPowerModeEnabledAsync) {
        throw new UnavailabilityError('expo-battery', 'isLowPowerModeEnabledAsync');
    }
    return await ExpoBattery.isLowPowerModeEnabledAsync();
}
export async function getPowerStateAsync() {
    if (!ExpoBattery.getPowerStateAsync) {
        throw new UnavailabilityError('expo-battery', 'getPowerStateAsync');
    }
    return await ExpoBattery.getPowerStateAsync();
}
export function addBatteryLevelListener(callback) {
    return BatteryEventEmitter.addListener('Expo.batteryLevelDidChange', callback);
}
export function addBatteryStateListener(callback) {
    return BatteryEventEmitter.addListener('Expo.batteryStateDidChange', callback);
}
export function addLowPowerModeListener(callback) {
    return BatteryEventEmitter.addListener('Expo.powerModeDidChange', callback);
}
//# sourceMappingURL=Battery.js.map