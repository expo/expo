globalThis.__DEV__ = true;

const { ReadableStream, TransformStream } = require('node:stream/web');
const { TextDecoder, TextEncoder } = require('node:util');

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
});

const { Blob, File } = require('node:buffer');

Object.defineProperties(globalThis, {
  Blob: { value: Blob },
  File: { value: File },
});
