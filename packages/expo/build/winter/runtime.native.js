// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// Add a well-known shared symbol that doesn't show up in iteration or inspection
// this can be used to detect if the global object abides by the Expo team's documented
// polyfill requirements.
const POLYFILL_SYMBOL = Symbol.for('expo.polyfill');
function addPolyfillSymbol(obj) {
    Object.defineProperty(obj, POLYFILL_SYMBOL, {
        value: true,
        enumerable: false,
        configurable: false,
    });
    return obj;
}
function install(name, getValue) {
    polyfillGlobal(name, () => addPolyfillSymbol(getValue()));
}
// https://url.spec.whatwg.org/#url
install('URL', () => require('./url').URL);
// https://url.spec.whatwg.org/#urlsearchparams
install('URLSearchParams', () => require('./url').URLSearchParams);
//# sourceMappingURL=runtime.native.js.map