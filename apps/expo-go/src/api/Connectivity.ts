import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type ConnectivityListener = (available: boolean) => void;

class Connectivity {
  _isAvailable = true;
  _listeners = new Set<ConnectivityListener>();

  constructor() {
    NetInfo.addEventListener(this._handleConnectivityChange);
    this.isAvailableAsync();
  }

  isAvailable(): boolean {
    return this._isAvailable;
  }

  async isAvailableAsync(): Promise<boolean> {
    if (this._isAvailable) {
      return this._isAvailable;
    }

    try {
      const netInfo = await NetInfo.fetch();
      this._isAvailable = netInfo.isConnected ?? false;
    } catch (e) {
      this._isAvailable = false;
      console.warn(`Uncaught error when fetching connectivity status: ${e}`);
    }

    return this._isAvailable;
  }

  _handleConnectivityChange = (netInfo: NetInfoState) => {
    this._isAvailable = netInfo.isConnected ?? false;
    this._listeners.forEach((listener) => {
      listener(this._isAvailable);
    });
  };

  addListener(listener: ConnectivityListener): void {
    this._listeners.add(listener);
  }

  removeListener(listener: ConnectivityListener): void {
    this._listeners.delete(listener);
  }
}

export default new Connectivity();
