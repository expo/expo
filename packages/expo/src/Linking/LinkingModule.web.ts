import invariant from 'invariant';

class Linking {
  constructor() {}

  async canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    return true;
  }

  async getInitialURL(): Promise<string> {
    return window.location.href;
  }

  async openURL(url: string): Promise<void> {
    this._validateURL(url);
    window.location.href = url;
  }

  addEventListener(type: string, handler: Function): void {}

  removeEventListener(type: string, handler: Function): void {}

  _validateURL(url: string): void {
    invariant(typeof url === 'string', 'Invalid URL: should be a string. Was: ' + url);
    invariant(url, 'Invalid URL: cannot be empty');
  }
}

export default new Linking();
