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
        let type = navigator.onLine ? NetworkStateType.UNKNOWN : NetworkStateType.NONE;
        let isConnected = navigator.onLine;
        let isInternetReachable = isConnected;
        return {
            type,
            isConnected,
            isInternetReachable,
        };
    },
    async getMacAddressAsync() {
        return null;
    },
};
//# sourceMappingURL=ExpoNetwork.web.js.map