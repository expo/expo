import { EventEmitter, NativeModulesProxy } from 'expo-core';
import invariant from 'invariant';

const PedometerEventEmitter = new EventEmitter(NativeModulesProxy.ExponentPedometer);

type PedometerResult = { steps: number };
type PedometerUpdateCallback = (result: PedometerResult) => void;
type PedometerListener = { remove: () => void };

export function watchStepCount(callback: PedometerUpdateCallback): PedometerListener {
  return PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);
}

export async function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult> {
  invariant(start <= end, 'Pedometer: The start date must precede the end date.');
  return await NativeModulesProxy.ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}

export async function isAvailableAsync(): Promise<boolean> {
  return await NativeModulesProxy.ExponentPedometer.isAvailableAsync();
}
