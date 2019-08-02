import { NetworkStateType } from './Network.types';
export default {
    async getIpAddressAsync() {
        return new Promise(async (resolve, reject) => {
            try {
                const resp = await fetch('https://api.ipify.org?format=json');
                const data = await resp.json();
                resolve(data.ip);
            }
            catch (e) {
                reject(e);
            }
        });
    },
    async getNetworkStateAsync() {
        let type = navigator.onLine ? NetworkStateType.UNKNOWN : NetworkStateType.NONE;
        let isConnected = navigator.onLine;
        let isInternetReachable = isConnected;
        return new Promise((resolve) => {
            resolve({
                type,
                isConnected,
                isInternetReachable,
            });
        });
    },
    async getMacAddressAsync() {
        return new Promise((resolve) => {
            resolve(null);
        });
    }
};
//# sourceMappingURL=ExpoNetwork.web.js.map