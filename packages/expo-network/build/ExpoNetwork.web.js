import { NetworkStateType } from './Network.types';
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
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        return {
            type: isOnline ? NetworkStateType.UNKNOWN : NetworkStateType.NONE,
            isConnected: isOnline,
            isInternetReachable: isOnline,
        };
    },
};
//# sourceMappingURL=ExpoNetwork.web.js.map