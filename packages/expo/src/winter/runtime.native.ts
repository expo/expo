// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import { polyfillGlobal as installGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// Add a well-known shared symbol that doesn't show up in iteration or inspection
// this can be used to detect if the global object abides by the Expo team's documented
// built-in requirements.
const BUILTIN_SYMBOL = Symbol.for('expo.builtin');

function addBuiltinSymbol(obj: object) {
  Object.defineProperty(obj, BUILTIN_SYMBOL, {
    value: true,
    enumerable: false,
    configurable: false,
  });
  return obj;
}

function install(name: string, getValue: () => any) {
  installGlobal(name, () => addBuiltinSymbol(getValue()));
}

// https://encoding.spec.whatwg.org/#textencoder
install('TextEncoder', () => {
  const TextEncoder = globalThis.expo!.TextEncoder;

  const originalEncode = TextEncoder.prototype.encode;

  TextEncoder.prototype.encode = function () {
    return new Uint8Array(originalEncode.apply(this, arguments));
  };

  return TextEncoder;
});

// https://encoding.spec.whatwg.org/#textdecoder
install('TextDecoder', () => globalThis.expo!.TextDecoder);

// // https://url.spec.whatwg.org/#url
// install('URL', () => require('./url').URL);
// // https://url.spec.whatwg.org/#urlsearchparams
// install('URLSearchParams', () => require('./url').URLSearchParams);
