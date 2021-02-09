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
    const type = navigator.onLine ? NetworkStateType.UNKNOWN : NetworkStateType.NONE;
    const isConnected = navigator.onLine;
    const isInternetReachable = isConnected;
    return {
      type,
      isConnected,
      isInternetReachable,
    };
  },
  async getMacAddressAsync(): Promise<null> {
    return null;
  },
};
