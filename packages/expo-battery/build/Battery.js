import { EventEmitter } from '@unimodules/core';
import ExpoBattery from './ExpoBattery';
const BatteryEventEmitter = new EventEmitter(ExpoBattery);
export async function getBatteryLevelAsync() {
    return await ExpoBattery.getBatteryLevelAsync();
}
export async function getBatteryStateAsync() {
    let batteryState = await ExpoBattery.getBatteryStateAsync();
    switch (batteryState) {
        case "CHARGING" /* CHARGING */:
            return "CHARGING" /* CHARGING */;
        case "FULL" /* FULL */:
            return "FULL" /* FULL */;
        case "UNPLUGGED" /* UNPLUGGED */:
            return "UNPLUGGED" /* UNPLUGGED */;
        case "UNKNOWN" /* UNKNOWN */:
            return "UNKNOWN" /* UNKNOWN */;
        default:
            return "UNKNOWN" /* UNKNOWN */;
    }
}
export async function isLowPowerModeEnabledAsync() {
    return await ExpoBattery.isLowPowerModeEnableAsync();
}
export async function getPowerStateAsync() {
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