import { UnavailabilityError, EventEmitter } from '@unimodules/core';

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

export async function getBatteryLevelAsync(): Promise<number> {
  if (!ExpoBattery.getBatteryLevelAsync) {
    throw new UnavailabilityError('expo-battery', 'getBatteryLevelAsync');
  }
  return await ExpoBattery.getBatteryLevelAsync();
}

export async function getBatteryStateAsync(): Promise<BatteryState> {
  if (!ExpoBattery.getBatteryStateAsync) {
    throw new UnavailabilityError('expo-battery', 'getBatteryStateAsync');
  }
  return await ExpoBattery.getBatteryStateAsync();
}

export async function isLowPowerModeEnabledAsync(): Promise<boolean> {
  if (!ExpoBattery.isLowPowerModeEnabledAsync) {
    throw new UnavailabilityError('expo-battery', 'isLowPowerModeEnabledAsync');
  }
  return await ExpoBattery.isLowPowerModeEnabledAsync();
}

export async function getPowerStateAsync(): Promise<PowerState> {
  if (!ExpoBattery.getPowerStateAsync) {
    throw new UnavailabilityError('expo-battery', 'getPowerStateAsync');
  }
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
