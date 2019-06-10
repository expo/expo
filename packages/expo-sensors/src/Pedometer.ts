import { EventEmitter } from '@unimodules/core';
import invariant from 'invariant';
import { UnavailabilityError } from '@unimodules/core';
import ExponentPedometer from './ExponentPedometer';

const PedometerEventEmitter = new EventEmitter(ExponentPedometer);

type PedometerResult = { steps: number };
type PedometerUpdateCallback = (result: PedometerResult) => void;
export interface PedometerListener {
  remove: () => void;
}

export function watchStepCount(callback: PedometerUpdateCallback): PedometerListener {
  return PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);
}

export async function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult> {
  if (!ExponentPedometer.getStepCountAsync) {
    throw new UnavailabilityError('ExponentPedometer', 'getStepCountAsync');
  }
  invariant(start <= end, 'Pedometer: The start date must precede the end date.');
  return await ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}

export async function isAvailableAsync(): Promise<boolean> {
  return await ExponentPedometer.isAvailableAsync();
}
