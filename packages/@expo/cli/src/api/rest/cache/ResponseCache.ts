import crypto from 'crypto';
import { ReadStream } from 'fs';
import type { Response, RequestInfo, RequestInit } from 'undici';

const GLOBAL_CACHE_VERSION = 4;

export type ResponseCacheEntry = {
  body: import('stream/web').ReadableStream;
  info: ReturnType<typeof getResponseInfo>;
};

export interface ResponseCache {
  /** Load the response info from cache, if any */
  get(cacheKey: string): Promise<ResponseCacheEntry | undefined>;
  /** Store the response info to cache, and return the cached info */
  set(cacheKey: string, response: ResponseCacheEntry): Promise<ResponseCacheEntry | undefined>;
  /** Remove a response entry from the cache */
  remove(cacheKey: string): Promise<void>;
}

export function getResponseInfo(response: Response) {
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

export function getRequestCacheKey(info: RequestInfo, init?: RequestInit) {
  const infoKeyData = getRequestInfoCacheData(info);
  const initKeyData = { body: init?.body ? getRequestBodyCacheData(init.body) : undefined };

  return crypto
    .createHash('md5')
    .update(JSON.stringify([infoKeyData, initKeyData, GLOBAL_CACHE_VERSION]))
    .digest('hex');
}

/** @internal Exposed for testing */
export function getRequestInfoCacheData(info: RequestInfo) {
  if (typeof info === 'string') {
    return { url: info };
  }

  if (info instanceof URL) {
    return { url: info.toString() };
  }

  if (info instanceof Request) {
    return {
      // cache: req.cache,
      credentials: info.credentials.toString(),
      destination: info.destination.toString(),
      headers: Object.fromEntries(info.headers.entries()),
      integrity: info.integrity,
      method: info.method,
      redirect: info.redirect,
      referrer: info.referrer,
      referrerPolicy: info.referrerPolicy,
      url: info.url.toString(),
      // body: // TODO
    };
  }

  throw new Error('Unsupported request info type for caching: ' + typeof info);
}

/** @internal Exposed for testing */
export function getRequestBodyCacheData(body: RequestInit['body']) {
  if (!body) {
    return body;
  }

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  // Supported for legacy purposes because node-fetch uses fs.readStream
  if (body instanceof ReadStream) {
    return body.path;
  }

  if (body.toString && body.toString() === '[object FormData]') {
    return new URLSearchParams(body as any).toString();
  }

  if (body instanceof Buffer) {
    return body.toString();
  }

  throw new Error(`Unsupported request body type for caching: ${typeof body}`);
}
