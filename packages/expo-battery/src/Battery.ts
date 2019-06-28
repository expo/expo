import ExpoBattery from './ExpoBattery';

import { Platform, UnavailabilityError, EventEmitter } from '@unimodules/core';
import {
  PowerState,
  BatteryLevelUpdateCallback,
  BatteryListener,
  BatteryStateUpdateCallback,
  PowerModeUpdateCallback
} from './Battery.types';

const BatteryEventEmitter = new EventEmitter(ExpoBattery);

export async function getBatteryLevelAsync(): Promise<number> {
  return await ExpoBattery.getBatteryLevelAsync();
}

export async function getBatteryStateAsync(): Promise<string> {
  return await ExpoBattery.getBatteryStateAsync();
}

export async function getPowerStateAsync(): Promise<PowerState> {
  return await ExpoBattery.getPowerStateAsync();
}

export function watchBatteryLevelChange(callback: BatteryLevelUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.batteryLevelDidChange', callback);
}

export function watchBatteryStateChange(callback: BatteryStateUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.batteryStateDidChange', callback);
}

export function watchPowerModeChange(callback: PowerModeUpdateCallback): BatteryListener {
  return BatteryEventEmitter.addListener('Expo.powerModeDidChange', callback);
}