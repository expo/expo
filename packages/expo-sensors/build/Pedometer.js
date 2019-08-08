import { EventEmitter } from '@unimodules/core';
import invariant from 'invariant';
import { UnavailabilityError } from '@unimodules/core';
import ExponentPedometer from './ExponentPedometer';
const PedometerEventEmitter = new EventEmitter(ExponentPedometer);
export function watchStepCount(callback) {
    return PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);
}
export async function getStepCountAsync(start, end) {
    if (!ExponentPedometer.getStepCountAsync) {
        throw new UnavailabilityError('ExponentPedometer', 'getStepCountAsync');
    }
    invariant(start <= end, 'Pedometer: The start date must precede the end date.');
    return await ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}
export async function isAvailableAsync() {
    return await ExponentPedometer.isAvailableAsync();
}
//# sourceMappingURL=Pedometer.js.map