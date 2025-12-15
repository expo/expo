// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import 'react-native/Libraries/Core/InitializeCore';

import { installFormDataPatch } from './FormData';
import { installGlobal as install } from './installGlobal';

// https://encoding.spec.whatwg.org/#textdecoder
install('TextDecoder', () => require('./TextDecoder').TextDecoder);
// https://encoding.spec.whatwg.org/#interface-textdecoderstream
install('TextDecoderStream', () => require('./TextDecoderStream').TextDecoderStream);
// https://encoding.spec.whatwg.org/#interface-textencoderstream
install('TextEncoderStream', () => require('./TextDecoderStream').TextEncoderStream);
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

// https://html.spec.whatwg.org/multipage/structured-data.html#structuredclone
install('structuredClone', () => require('@ungap/structured-clone').default);

installFormDataPatch(FormData);

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error: readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
