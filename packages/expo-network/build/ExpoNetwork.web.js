import { EventEmitter } from 'expo-modules-core';
import { NetworkStateType } from './Network.types';
const emitter = new EventEmitter();
const onNetworkStateEventName = 'onNetworkStateChanged';
function getNetworkState() {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    return {
        type: isOnline ? NetworkStateType.UNKNOWN : NetworkStateType.NONE,
        isConnected: isOnline,
        isInternetReachable: isOnline,
    };
}
function updateNetworkState() {
    const state = getNetworkState();
    emitter.emit(onNetworkStateEventName, state);
}
export default {
    async getIpAddressAsync() {
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            const data = await resp.json();
            return data.ip;
        }
        catch (e) {
            throw e;
        }
    },
    async getNetworkStateAsync() {
        return getNetworkState();
    },
    startObserving() {
        window.addEventListener('online', updateNetworkState);
        window.addEventListener('offline', updateNetworkState);
    },
    stopObserving() {
        window.removeEventListener('online', updateNetworkState);
        window.removeEventListener('offline', updateNetworkState);
    },
};
//# sourceMappingURL=ExpoNetwork.web.js.map