import { EventEmitter, Platform } from 'expo-modules-core';

import { type BatteryEvents, BatteryState } from './Battery.types';

const emitter = new EventEmitter<BatteryEvents>();

declare let navigator: Navigator;

interface BatteryManager extends BatteryManagerEventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
}

interface BatteryManagerEventTargetEventMap {
  chargingchange: Event;
  chargingtimechange: Event;
  dischargingtimechange: Event;
  levelchange: Event;
}

interface BatteryManagerEventTarget extends EventTarget {
  onchargingchange: (this: BatteryManager, ev: Event) => any;
  onlevelchange: (this: BatteryManager, ev: Event) => any;
  onchargingtimechange: (this: BatteryManager, ev: Event) => any;
  ondischargingtimechange: (this: BatteryManager, ev: Event) => any;
  addEventListener<K extends keyof BatteryManagerEventTargetEventMap>(
    type: K,
    listener: (this: BatteryManager, ev: BatteryManagerEventTargetEventMap[K]) => any,
    useCapture?: boolean
  ): void;
}

export default {
  get isSupported(): boolean {
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery#Browser_compatibility
    return Platform.isDOMAvailable && ('getBattery' in navigator || 'battery' in navigator);
  },

  async getBatteryLevelAsync(): Promise<number> {
    const batteryManager = await getBatteryManagerAsync();
    if (!batteryManager) return -1;

    return batteryManager.level;
  },

  async getBatteryStateAsync(): Promise<BatteryState> {
    const batteryManager = await getBatteryManagerAsync();
    if (!batteryManager) return BatteryState.UNKNOWN;
    return getBatteryState(batteryManager.charging, batteryManager.level);
  },

  async startObserving() {
    const batteryManager = await getBatteryManagerAsync();
    if (!batteryManager) return;
    batteryManager.addEventListener('chargingchange', onChargingChange);
    batteryManager.addEventListener('levelchange', onLevelChange);
  },

  async stopObserving() {
    const batteryManager = await getBatteryManagerAsync();
    if (!batteryManager) return;
    batteryManager.removeEventListener('chargingchange', onChargingChange);
    batteryManager.removeEventListener('levelchange', onLevelChange);
  },
};

let lastReportedState: BatteryState = BatteryState.UNKNOWN;

function getBatteryState(isCharging: boolean, level: number): BatteryState {
  return isCharging
    ? level >= 1.0
      ? BatteryState.FULL
      : BatteryState.CHARGING
    : BatteryState.UNPLUGGED;
}

function emitStateChange(isCharging: boolean, level: number) {
  const batteryState = getBatteryState(isCharging, level);
  // prevent sending the same state change twice.
  if (batteryState === lastReportedState) return;
  lastReportedState = batteryState;
  emitter.emit('Expo.batteryStateDidChange', { batteryState });
}

function onChargingChange(this: BatteryManager): void {
  emitStateChange(this.charging, this.level);
}

function onLevelChange(this: BatteryManager): void {
  const batteryLevel = this.level;
  // update the state as well in case the state changed to full.
  emitStateChange(this.charging, this.level);
  emitter.emit('Expo.batteryLevelDidChange', { batteryLevel });
}

async function getBatteryManagerAsync(): Promise<BatteryManager | null> {
  if (Platform.isDOMAvailable === false) return null;
  if ('getBattery' in navigator) {
    // @ts-ignore
    return await navigator.getBattery();
  } else {
    // @ts-ignore
    return await navigator.battery;
  }
}
