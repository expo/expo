// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/

// @ts-ignore: PolyfillFunctions does not have types exported
import { polyfillGlobal as installGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

import { installFormDataPatch } from './FormData';
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

// https://encoding.spec.whatwg.org/#textdecoder
install('TextDecoder', () => require('./TextDecoder').TextDecoder);
// https://url.spec.whatwg.org/#url
install('URL', () => require('./url').URL);
// https://url.spec.whatwg.org/#urlsearchparams
install('URLSearchParams', () => require('./url').URLSearchParams);

installFormDataPatch(FormData);

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error: readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
