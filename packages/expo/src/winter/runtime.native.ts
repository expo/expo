// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/

import { installFormDataPatch } from './FormData';
import { ImportMetaRegistry } from './ImportMetaRegistry';
import { installGlobal as install } from './installGlobal';
import clone from './structuredClone';

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

install('__ExpoImportMetaRegistry', () => ImportMetaRegistry);

// https://html.spec.whatwg.org/multipage/structured-data.html#structuredclone
install('structuredClone', () => clone);

installFormDataPatch(FormData);

// Polyfill async iterator symbol for Hermes.
// @ts-expect-error: readonly property only applies when the engine supports it
Symbol.asyncIterator ??= Symbol.for('Symbol.asyncIterator');
