/*global crypto*/
import getRandomValues from './getRandomValues';

class Crypto {
  getRandomValues<TArray extends ArrayBufferView>(values: TArray): TArray {
    return getRandomValues(values);
  }
}

const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto();

export default webCrypto;

export function polyfillWebCrypto(): void {
  if (typeof crypto === 'undefined') {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
}
