import ExpoBattery from './ExpoBattery';
import { EventEmitter } from '@unimodules/core';
const BatteryEventEmitter = new EventEmitter(ExpoBattery);
export async function getBatteryLevelAsync() {
    return await ExpoBattery.getBatteryLevelAsync();
}
export async function getBatteryStateAsync() {
    return await ExpoBattery.getBatteryStateAsync();
}
export async function getPowerStateAsync() {
    return await ExpoBattery.getPowerStateAsync();
}
export function watchBatteryLevelChange(callback) {
    return BatteryEventEmitter.addListener('Expo.batteryLevelDidChange', callback);
}
export function watchBatteryStateChange(callback) {
    return BatteryEventEmitter.addListener('Expo.batteryStateDidChange', callback);
}
export function watchPowerModeChange(callback) {
    return BatteryEventEmitter.addListener('Expo.powerModeDidChange', callback);
}
//# sourceMappingURL=Battery.js.map