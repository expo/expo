import { EventEmitter } from '@unimodules/core';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { BatteryState } from './Battery.types';
const emitter = new EventEmitter({});
export default {
    get name() {
        return 'ExpoBattery';
    },
    get isSupported() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery#Browser_compatibility
        return canUseDOM && ('getBattery' in navigator || 'battery' in navigator);
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
        return batteryManager.charging ? BatteryState.CHARGING : BatteryState.UNPLUGGED;
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
function onChargingChange() {
    const batteryState = this.charging ? BatteryState.CHARGING : BatteryState.UNPLUGGED;
    emitter.emit('Expo.batteryStateDidChange', { batteryState });
}
function onLevelChange() {
    const batteryLevel = this.level;
    emitter.emit('Expo.batteryLevelDidChange', { batteryLevel });
}
async function getBatteryManagerAsync() {
    if (!canUseDOM)
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