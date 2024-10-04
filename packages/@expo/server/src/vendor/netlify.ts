import type { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Headers, readableStreamToString, RequestInit } from '@remix-run/node';
import { AbortController } from 'abort-controller';

import { createRequestHandler as createExpoHandler } from '..';
import { ExpoRequest, ExpoResponse } from '../environment';

export function createRequestHandler({ build }: { build: string }) {
  const handleRequest = createExpoHandler(build);

  return async (event: HandlerEvent) => {
    const response = await handleRequest(convertRequest(event));

    return respond(response);
  };
}

export async function respond(res: ExpoResponse): Promise<HandlerResponse> {
  const contentType = res.headers.get('Content-Type');
  let body: string | undefined;
  const isBase64Encoded = isBinaryType(contentType);

  if (res.body) {
    if (isBase64Encoded) {
      body = await readableStreamToString(res.body, 'base64');
    } else {
      body = await res.text();
    }
  }

  const multiValueHeaders = res.headers.raw();

  return {
    statusCode: res.status,
    multiValueHeaders,
    body,
    isBase64Encoded,
  };
}

export function createHeaders(requestHeaders: HandlerEvent['multiValueHeaders']): Headers {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      for (const value of values) {
        headers.append(key, value);
      }
    }
  }

  return headers;
}

// `netlify dev` doesn't return the full url in the event.rawUrl, so we need to create it ourselves
function getRawPath(event: HandlerEvent): string {
  let rawPath = event.path;
  const searchParams = new URLSearchParams();

  if (!event.multiValueQueryStringParameters) {
    return rawPath;
  }

  const paramKeys = Object.keys(event.multiValueQueryStringParameters);
  for (const key of paramKeys) {
    const values = event.multiValueQueryStringParameters[key];
    if (!values) continue;
    for (const val of values) {
      searchParams.append(key, val);
    }
  }

  const rawParams = searchParams.toString();

  if (rawParams) rawPath += `?${rawParams}`;

  return rawPath;
}

export function convertRequest(event: HandlerEvent): ExpoRequest {
  let url: URL;

  if (process.env.NODE_ENV !== 'development') {
    url = new URL(event.rawUrl);
  } else {
    const origin = event.headers.host;
    const rawPath = getRawPath(event);
    url = new URL(`http://${origin}${rawPath}`);
  }

  // Note: No current way to abort these for Netlify, but our router expects
  // requests to contain a signal so it can detect aborted requests
  const controller = new AbortController();

  const init: RequestInit = {
    method: event.httpMethod,
    headers: createHeaders(event.multiValueHeaders),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as RequestInit['signal'],
  };

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
    const isFormData = event.headers['content-type']?.includes('multipart/form-data');
    init.body = event.isBase64Encoded
      ? isFormData
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body, 'base64').toString()
      : event.body;
  }

  return new ExpoRequest(url.href, init);
}

/**
 * Common binary MIME types
 * @see https://github.com/architect/functions/blob/45254fc1936a1794c185aac07e9889b241a2e5c6/src/http/helpers/binary-types.js
 */
const binaryTypes = [
  'application/octet-stream',
  // Docs
  'application/epub+zip',
  'application/msword',
  'application/pdf',
  'application/rtf',
  'application/vnd.amazon.ebook',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Fonts
  'font/otf',
  'font/woff',
  'font/woff2',
  // Images
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/vnd.microsoft.icon',
  'image/webp',
  // Audio
  'audio/3gpp',
  'audio/aac',
  'audio/basic',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-aiff',
  'audio/x-midi',
  'audio/x-wav',
  // Video
  'video/3gpp',
  'video/mp2t',
  'video/mpeg',
  'video/ogg',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  // Archives
  'application/java-archive',
  'application/vnd.apple.installer+xml',
  'application/x-7z-compressed',
  'application/x-apple-diskimage',
  'application/x-bzip',
  'application/x-bzip2',
  'application/x-gzip',
  'application/x-java-archive',
  'application/x-rar-compressed',
  'application/x-tar',
  'application/x-zip',
  'application/zip',
];

export function isBinaryType(contentType: string | null | undefined) {
  if (!contentType) return false;
  const [test] = contentType.split(';');
  return binaryTypes.includes(test);
}
