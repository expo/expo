import { EventEmitter, Platform } from 'expo-modules-core';
import { BatteryState } from './Battery.types';
const emitter = new EventEmitter();
export default {
    get isSupported() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery#Browser_compatibility
        return Platform.isDOMAvailable && ('getBattery' in navigator || 'battery' in navigator);
    },
    async getBatteryLevelAsync() {
        const batteryManager = await getBatteryManagerAsync();
        if (!batteryManager)
            return -1;
        return batteryManager.level;
    },
    async getBatteryStateAsync() {
        const batteryManager = await getBatteryManagerAsync();
        if (!batteryManager)
            return BatteryState.UNKNOWN;
        return getBatteryState(batteryManager.charging, batteryManager.level);
    },
    async startObserving() {
        const batteryManager = await getBatteryManagerAsync();
        if (!batteryManager)
            return;
        batteryManager.addEventListener('chargingchange', onChargingChange);
        batteryManager.addEventListener('levelchange', onLevelChange);
    },
    async stopObserving() {
        const batteryManager = await getBatteryManagerAsync();
        if (!batteryManager)
            return;
        batteryManager.removeEventListener('chargingchange', onChargingChange);
        batteryManager.removeEventListener('levelchange', onLevelChange);
    },
};
let lastReportedState = BatteryState.UNKNOWN;
function getBatteryState(isCharging, level) {
    return isCharging
        ? level >= 1.0
            ? BatteryState.FULL
            : BatteryState.CHARGING
        : BatteryState.UNPLUGGED;
}
function emitStateChange(isCharging, level) {
    const batteryState = getBatteryState(isCharging, level);
    // prevent sending the same state change twice.
    if (batteryState === lastReportedState)
        return;
    lastReportedState = batteryState;
    emitter.emit('Expo.batteryStateDidChange', { batteryState });
}
function onChargingChange() {
    emitStateChange(this.charging, this.level);
}
function onLevelChange() {
    const batteryLevel = this.level;
    // update the state as well in case the state changed to full.
    emitStateChange(this.charging, this.level);
    emitter.emit('Expo.batteryLevelDidChange', { batteryLevel });
}
async function getBatteryManagerAsync() {
    if (Platform.isDOMAvailable === false)
        return null;
    if ('getBattery' in navigator) {
        // @ts-ignore
        return await navigator.getBattery();
    }
    else {
        // @ts-ignore
        return await navigator.battery;
    }
}
//# sourceMappingURL=ExpoBattery.web.js.map