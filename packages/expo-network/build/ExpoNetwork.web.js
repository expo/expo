import { NativeModule, registerWebModule } from 'expo-modules-core';
import { NetworkStateType } from './Network.types';
const onNetworkStateEventName = 'onNetworkStateChanged';
function getNetworkState() {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    return {
        type: isOnline ? NetworkStateType.UNKNOWN : NetworkStateType.NONE,
        isConnected: isOnline,
        isInternetReachable: isOnline,
    };
}
class ExpoNetworkModule extends NativeModule {
    eventListener;
    updateNetworkState() {
        const state = getNetworkState();
        this.emit(onNetworkStateEventName, state);
    }
    async getIpAddressAsync() {
        try {
            const resp = await fetch('https://api.ipify.org?format=json');
            const data = await resp.json();
            return data.ip;
        }
        catch (e) {
            throw e;
        }
    }
    async getNetworkStateAsync() {
        return getNetworkState();
    }
    async isAirplaneModeEnabledAsync() {
        return false;
    }
    startObserving() {
        this.eventListener = () => this.updateNetworkState();
        window.addEventListener('online', this.eventListener);
        window.addEventListener('offline', this.eventListener);
    }
    stopObserving() {
        if (this.eventListener) {
            window.removeEventListener('online', this.eventListener);
            window.removeEventListener('offline', this.eventListener);
        }
    }
}
export default registerWebModule(ExpoNetworkModule);
//# sourceMappingURL=ExpoNetwork.web.js.map