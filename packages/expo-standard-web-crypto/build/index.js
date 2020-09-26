/*global crypto*/
import getRandomValues from './getRandomValues';
class Crypto {
    getRandomValues(values) {
        return getRandomValues(values);
    }
}
const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto();
export default webCrypto;
export function polyfillWebCrypto() {
    if (typeof crypto === 'undefined') {
        Object.defineProperty(window, 'crypto', {
            configurable: true,
            enumerable: true,
            get: () => webCrypto,
        });
    }
}
//# sourceMappingURL=index.js.map