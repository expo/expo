import { ReadableStream } from 'web-streams-polyfill';

import { type NativeHeadersType } from './NativeRequest';
import { convertFormDataAsync } from './convertFormData';
import { blobToArrayBufferAsync } from '../../utils/blobUtils';

/**
 * convert a ReadableStream to a Uint8Array
 */
export async function convertReadableStreamToUint8ArrayAsync(
  stream: ReadableStream<Uint8Array>
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  // Read all chunks from the stream
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  // Concatenate all chunks into a single Uint8Array
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Normalize a BodyInit object to a Uint8Array for NativeRequest
 */
export async function normalizeBodyInitAsync(
  body: BodyInit | null | undefined
): Promise<{ body: Uint8Array | null; overriddenHeaders?: NativeHeadersType }> {
  if (body == null) {
    return { body: null };
  }

  if (typeof body === 'string') {
    const encoder = new TextEncoder();
    return { body: encoder.encode(body) };
  }

  if (body instanceof ArrayBuffer) {
    return { body: new Uint8Array(body) };
  }

  if (ArrayBuffer.isView(body)) {
    return { body: new Uint8Array(body.buffer, body.byteOffset, body.byteLength) };
  }

  if (body instanceof Blob) {
    return {
      body: new Uint8Array(await blobToArrayBufferAsync(body)),
      overriddenHeaders: [['Content-Type', body.type]],
    };
  }

  if (body instanceof URLSearchParams) {
    const encoder = new TextEncoder();
    return { body: encoder.encode(body.toString()) };
  }

  if (body instanceof ReadableStream) {
    const result = await convertReadableStreamToUint8ArrayAsync(body);
    return { body: result };
  }

  if (body instanceof FormData) {
    const { body: result, boundary } = await convertFormDataAsync(body);

    return {
      body: result,
      overriddenHeaders: [['Content-Type', `multipart/form-data; boundary=${boundary}`]],
    };
  }

  throw new TypeError('Unsupported BodyInit type');
}

/**
 * Normalize a HeadersInit object to an array of key-value tuple for NativeRequest.
 */
export function normalizeHeadersInit(headers: HeadersInit | null | undefined): NativeHeadersType {
  if (headers == null) {
    return [];
  }
  if (Array.isArray(headers)) {
    return headers;
  }
  if (headers instanceof Headers) {
    const results: [string, string][] = [];
    headers.forEach((value: any, key: any) => {
      results.push([key, value]);
    });
    return results;
  }
  return Object.entries(headers);
}

/**
 * Create a new header array by overriding the existing headers with new headers (by header key).
 */
export function overrideHeaders(
  headers: NativeHeadersType,
  newHeaders: NativeHeadersType
): NativeHeadersType {
  const newKeySet = new Set(newHeaders.map(([key]) => key.toLocaleLowerCase()));
  const result: NativeHeadersType = [];
  for (const [key, value] of headers) {
    if (!newKeySet.has(key.toLocaleLowerCase())) {
      result.push([key, value]);
    }
  }
  for (const [key, value] of newHeaders) {
    result.push([key, value]);
  }
  return result;
}
