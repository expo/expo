import { UnavailabilityError } from '@unimodules/core';
import ExpoNetwork from './ExpoNetwork';
import { NetworkStateType } from './Network.types';
export { NetworkStateType };
export async function getNetworkStateAsync() {
    if (!ExpoNetwork.getNetworkStateAsync) {
        throw new UnavailabilityError('expo-network', 'getNetworkStateAsync');
    }
    return await ExpoNetwork.getNetworkStateAsync();
}
export async function getIpAddressAsync() {
    if (!ExpoNetwork.getIpAddressAsync) {
        throw new UnavailabilityError('expo-network', 'getIpAddressAsync');
    }
    return await ExpoNetwork.getIpAddressAsync();
}
/**
 * @deprecated getMacAddressAsync has been deprecated and will be removed in a future SDK version.
 * It always returns '02:00:00:00:00:00'.
 */
export async function getMacAddressAsync(interfaceName = null) {
    console.warn('Network.getMacAddressAsync has been deprecated and will be removed in a future SDK version. To uniquely identify a device, use the expo-application module instead.');
    return '02:00:00:00:00:00';
}
export async function isAirplaneModeEnabledAsync() {
    if (!ExpoNetwork.isAirplaneModeEnabledAsync) {
        throw new UnavailabilityError('expo-network', 'isAirplaneModeEnabledAsync');
    }
    return await ExpoNetwork.isAirplaneModeEnabledAsync();
}
//# sourceMappingURL=Network.js.map