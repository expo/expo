import { NetworkState, NetworkStateType } from './Network.types';

export default {
  async getIpAddressAsync(): Promise<string> {
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const data = await resp.json();
      return data.ip;
    } catch (e) {
      throw e;
    }
  },
  async getNetworkStateAsync(): Promise<NetworkState> {
    const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
    return {
      type: isOnline ? NetworkStateType.UNKNOWN : NetworkStateType.NONE,
      isConnected: isOnline,
      isInternetReachable: isOnline,
    };
  },
};
