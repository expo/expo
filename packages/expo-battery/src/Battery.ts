import { Platform, EventEmitter } from '@unimodules/core';

import ExpoBattery from './ExpoBattery';
import {
  PowerState,
  BatteryState,
  BatteryLevelUpdateCallback,
  BatteryListener,
  BatteryStateUpdateCallback,
  PowerModeUpdateCallback,
} from './Battery.types';

const BatteryEventEmitter = new EventEmitter(ExpoBattery);

export { BatteryState };

export async function getBatteryLevelAsync(): Promise<number> {
  return await ExpoBattery.getBatteryLevelAsync();
}

export async function getBatteryStateAsync(): Promise<BatteryState> {
  let batteryState = await ExpoBattery.getBatteryStateAsync();
  switch (batteryState) {
    case BatteryState.CHARGING:
      return BatteryState.CHARGING;
    case BatteryState.FULL:
      return BatteryState.FULL;
    case BatteryState.UNPLUGGED:
      return BatteryState.UNPLUGGED;
    case BatteryState.UNKNOWN:
      return BatteryState.UNKNOWN;
    default:
      return BatteryState.UNKNOWN;
  }
}

export async function isLowPowerModeEnabledAsync(): Promise<boolean> {
  return await ExpoBattery.isLowPowerModeEnabledAsync();
}

export async function getPowerStateAsync(): Promise<PowerState> {
  return await ExpoBattery.getPowerStateAsync();
}

export function addBatteryLevelListener(callback: BatteryLevelUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.batteryLevelDidChange', callback);
}

export function addBatteryStateListener(callback: BatteryStateUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.batteryStateDidChange', callback);
}

export function addLowPowerModeListener(callback: PowerModeUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.powerModeDidChange', callback);
}
