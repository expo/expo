import { Platform, UnavailabilityError } from '@unimodules/core';
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
    let ipAddress = await ExpoNetwork.getIpAddressAsync();
    if (ipAddress == '0.0.0.0') {
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            const data = await resp.json();
            ipAddress = data.ip;
        }
        catch (e) {
            throw e;
        }
    }
    return ipAddress;
}
export async function getMacAddressAsync(interfaceName = null) {
    if (!ExpoNetwork.getMacAddressAsync) {
        throw new UnavailabilityError('expo-network', 'getMacAddressAsync');
    }
    if (Platform.OS === 'android') {
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