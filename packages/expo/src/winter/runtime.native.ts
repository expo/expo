// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/

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
// ReadableStream is injected by Metro as a global

install('__ExpoImportMetaRegistry', () => require('./ImportMetaRegistry').ImportMetaRegistry);

// https://html.spec.whatwg.org/multipage/structured-data.html#structuredclone
install('structuredClone', () => require('@ungap/structured-clone').default);

installFormDataPatch(FormData);

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error: readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
