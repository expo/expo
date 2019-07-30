import { NetworkStateType } from './Network.types';
export default {
    async getIpAddressAsync() {
        return new Promise((resolve, reject) => {
            fetch('https://api.ipify.org?format=json')
                .then(data => {
                data.json().then(result => {
                    resolve(result.ip);
                });
            })
                .catch(err => {
                reject(err);
            });
        });
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
};
//# sourceMappingURL=ExpoNetwork.web.js.map