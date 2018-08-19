// @flow

import { NativeEventEmitter, NativeModules } from 'react-native';
import invariant from 'invariant';

const PedometerEventEmitter = new NativeEventEmitter(NativeModules.ExponentPedometer);

type PedometerResult = { steps: number };
type PedometerUpdateCallback = (result: PedometerResult) => void;
type PedometerListener = { remove: () => void };

let _listenerCount = 0;

export function watchStepCount(callback: PedometerUpdateCallback): PedometerListener {
  if (_listenerCount === 0) {
    NativeModules.ExponentPedometer.watchStepCount();
  }
  _listenerCount++;

  const listener = PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);

  return {
    remove() {
      listener.remove();
      _listenerCount--;
      if (_listenerCount === 0) {
        NativeModules.ExponentPedometer.stopWatchingStepCount();
      }
    },
  };
}

export async function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult> {
  invariant(start <= end, 'Pedometer: The start date must precede the end date.');
  return await NativeModules.ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}

export async function isAvailableAsync(): Promise<boolean> {
  return await NativeModules.ExponentPedometer.isAvailableAsync();
}
