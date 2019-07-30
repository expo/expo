import { NetworkState, NetworkStateType } from './Network.types';

export default {
  async getIpAddressAsync(): Promise<string> {
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
  async getNetworkStateAsync(): Promise<NetworkState> {
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
