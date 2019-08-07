import { NetInfo } from 'react-native';

type ConnectivityListener = (available: boolean) => void;

class Connectivity {
  _isAvailable = true;
  _listeners = new Set<ConnectivityListener>();

  constructor() {
    NetInfo.isConnected.addEventListener('connectionChange', this._handleConnectivityChange);
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
      this._isAvailable = await NetInfo.isConnected.fetch();
    } catch (e) {
      this._isAvailable = false;
      console.warn(`Uncaught error when fetching connectivity status: ${e}`);
    }

    return this._isAvailable;
  }

  _handleConnectivityChange = (isAvailable: boolean) => {
    this._isAvailable = isAvailable;
    this._listeners.forEach(listener => {
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
