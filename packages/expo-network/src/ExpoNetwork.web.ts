import { EventEmitter } from 'expo-modules-core';

import { type NetworkEvents, NetworkState, NetworkStateType } from './Network.types';

const emitter = new EventEmitter<NetworkEvents>();
const onNetworkStateEventName = 'onNetworkStateChanged';

function getNetworkState(): NetworkState {
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
