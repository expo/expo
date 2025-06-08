// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import 'react-native/Libraries/Core/InitializeCore';

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

// https://streams.spec.whatwg.org/#rs
install('AbortSignal', () => require('web-streams-polyfill/ponyfill').AbortSignal);
install('ByteLengthQueuingStrategy', () => require('web-streams-polyfill/ponyfill').ByteLengthQueuingStrategy);
install('CountQueuingStrategy', () => require('web-streams-polyfill/ponyfill').CountQueuingStrategy);
install('ReadableByteStreamController', () => require('web-streams-polyfill/ponyfill').ReadableByteStreamController);
install('ReadableStream', () => require('web-streams-polyfill/ponyfill').ReadableStream);
install('ReadableStreamBYOBReader', () => require('web-streams-polyfill/ponyfill').ReadableStreamBYOBReader);
install('ReadableStreamBYOBRequest', () => require('web-streams-polyfill/ponyfill').ReadableStreamBYOBRequest);
install('ReadableStreamDefaultController', () => require('web-streams-polyfill/ponyfill').ReadableStreamDefaultController);
install('ReadableStreamDefaultReader', () => require('web-streams-polyfill/ponyfill').ReadableStreamDefaultReader);
install('TransformStream', () => require('web-streams-polyfill/ponyfill').TransformStream);
install('TransformStreamDefaultController', () => require('web-streams-polyfill/ponyfill').TransformStreamDefaultController);
install('WritableStream', () => require('web-streams-polyfill/ponyfill').WritableStream);
install('WritableStreamDefaultController', () => require('web-streams-polyfill/ponyfill').WritableStreamDefaultController);
install('WritableStreamDefaultWriter', () => require('web-streams-polyfill/ponyfill').WritableStreamDefaultWriter);

install('__ExpoImportMetaRegistry', () => require('./ImportMetaRegistry').ImportMetaRegistry);

installFormDataPatch(FormData);

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error: readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
