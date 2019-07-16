import invariant from 'invariant';
import { NativeEventEmitter, NativeModules } from 'react-native';
const PedometerEventEmitter = new NativeEventEmitter(NativeModules.ExponentPedometer);
let _listenerCount = 0;
export function watchStepCount(callback) {
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
export async function getStepCountAsync(start, end) {
    invariant(start <= end, 'Pedometer: The start date must precede the end date.');
    return await NativeModules.ExponentPedometer.getStepCountAsync(start.getTime(), end.getTime());
}
export async function isAvailableAsync() {
    return await NativeModules.ExponentPedometer.isAvailableAsync();
}
export default {
    watchStepCount,
    getStepCountAsync,
    isAvailableAsync,
};
//# sourceMappingURL=Pedometer.android.js.map