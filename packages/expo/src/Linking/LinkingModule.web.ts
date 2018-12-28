import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';
import invariant from 'invariant';

class RNLinking extends NativeEventEmitter {

    constructor() {
      super({ addListener() {}, removeListeners() {} })
    }

    async canOpenURL(url: string): Promise<boolean> {
      this._validateURL(url);
      return true;
    }
    async getInitialURL(): Promise<string> {
      return window.location.href;
    }
    async openURL(url: string): Promise<void> {
      this._validateURL(url);
      window.location.href = new URL(url, window.location.href).toString();
    }
    
    addEventListener = (type: string, handler: Function) => {
      // this.addListener(type, handler);
    }

    removeEventListener(type: string, handler: Function) {
      // this.removeListener(type, handler);
    }

    _validateURL(url: string) {
      invariant(
        typeof url === 'string',
        'Invalid URL: should be a string. Was: ' + url,
      );
      invariant(url, 'Invalid URL: cannot be empty');
    }

}

export default new RNLinking();
