import { EventEmitter, NativeModulesProxy } from 'expo-core';
import invariant from 'invariant';
const PedometerEventEmitter = new EventEmitter(NativeModulesProxy.ExponentPedometer);
export function watchStepCount(callback) {
    return PedometerEventEmitter.addListener('Exponent.pedometerUpdate', callback);
}
export async function getStepCountAsync(start, end) {
    invariant(start <= end, 'Pedometer: The start date must precede the end date.');
    return await NativeModulesProxy.ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}
export async function isAvailableAsync() {
    return await NativeModulesProxy.ExponentPedometer.isAvailableAsync();
}
//# sourceMappingURL=Pedometer.js.map