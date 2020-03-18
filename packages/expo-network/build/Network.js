import { Platform, UnavailabilityError, CodedError } from '@unimodules/core';
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
export async function getMacAddressAsync(interfaceName) {
    if (!ExpoNetwork.getMacAddressAsync) {
        throw new UnavailabilityError('expo-network', 'getMacAddressAsync');
    }
    if (Platform.OS === 'android') {
        if (interfaceName === undefined) {
            throw new CodedError('ERR_NETWORK_UNDEFINED_INTERFACE', "Passing undefined as interface name is not supported on Android. Pass in explicit null if you don't care for which interface the MAC address will be returned.");
        }
        return await ExpoNetwork.getMacAddressAsync(interfaceName);
    }
    else {
        return await ExpoNetwork.getMacAddressAsync();
    }
}
export async function isAirplaneModeEnabledAsync() {
    if (!ExpoNetwork.isAirplaneModeEnabledAsync) {
        throw new UnavailabilityError('expo-network', 'isAirplaneModeEnabledAsync');
    }
    return await ExpoNetwork.isAirplaneModeEnabledAsync();
}
//# sourceMappingURL=Network.js.map