import { EventEmitter, Subscription } from '@unimodules/core';

import {
  BatteryLevelEvent,
  BatteryLevelUpdateListener,
  BatteryState,
  BatteryStateEvent,
  BatteryStateUpdateListener,
  PowerModeEvent,
  PowerModeUpdateListener,
  PowerState,
} from './Battery.types';
import ExpoBattery from './ExpoBattery';

const BatteryEventEmitter = new EventEmitter(ExpoBattery);

export async function isAvailableAsync(): Promise<boolean> {
  return Promise.resolve((ExpoBattery && ExpoBattery.isSupported) || false);
}

export async function getBatteryLevelAsync(): Promise<number> {
  if (!ExpoBattery.getBatteryLevelAsync) {
    return -1;
  }
  return await ExpoBattery.getBatteryLevelAsync();
}

export async function getBatteryStateAsync(): Promise<BatteryState> {
  if (!ExpoBattery.getBatteryStateAsync) {
    return BatteryState.UNKNOWN;
  }
  return await ExpoBattery.getBatteryStateAsync();
}

export async function isLowPowerModeEnabledAsync(): Promise<boolean> {
  if (!ExpoBattery.isLowPowerModeEnabledAsync) {
    return false;
  }
  return await ExpoBattery.isLowPowerModeEnabledAsync();
}

export async function getPowerStateAsync(): Promise<PowerState> {
  const [batteryLevel, batteryState, lowPowerMode] = await Promise.all([
    getBatteryLevelAsync(),
    getBatteryStateAsync(),
    isLowPowerModeEnabledAsync(),
  ]);
  return {
    batteryLevel,
    batteryState,
    lowPowerMode,
  };
}

export function addBatteryLevelListener(listener: BatteryLevelUpdateListener): Subscription {
  return BatteryEventEmitter.addListener('Expo.batteryLevelDidChange', listener);
}

export function addBatteryStateListener(listener: BatteryStateUpdateListener): Subscription {
  return BatteryEventEmitter.addListener('Expo.batteryStateDidChange', listener);
}

export function addLowPowerModeListener(listener: PowerModeUpdateListener): Subscription {
  return BatteryEventEmitter.addListener('Expo.powerModeDidChange', listener);
}

export {
  BatteryLevelEvent,
  BatteryLevelUpdateListener,
  BatteryState,
  BatteryStateEvent,
  BatteryStateUpdateListener,
  PowerModeEvent,
  PowerModeUpdateListener,
  PowerState,
  Subscription,
};
