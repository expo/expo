import { NetworkState, NetworkStateType } from './Network.types';

export default {
  async getIpAddressAsync(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        resolve(data.ip);
      } catch (e) {
        reject(e);
      }
    }
    );
  },
  async getNetworkStateAsync(): Promise<NetworkState> {
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
  async getMacAddressAsync(): Promise<null> {
    return new Promise((resolve) => {
      resolve(null);
    });
  }
};
