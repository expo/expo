globalThis.__DEV__ = true;

const { Blob, File } = require('node:buffer');
const { ReadableStream, TransformStream } = require('node:stream/web');
const { TextDecoder, TextEncoder } = require('node:util');

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
});

Object.defineProperties(globalThis, {
  Blob: { value: Blob },
  File: { value: File },
});
