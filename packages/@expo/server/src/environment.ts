/* eslint-disable no-var */
import './assertion';

import type * as undici from 'undici';

declare global {
  interface RequestInit extends undici.RequestInit {
    duplex?: 'half';
  }

  interface Request extends undici.Request {}
  var Request: typeof Request;

  interface Response extends undici.Response {}
  var Response: typeof Response;

  interface Headers extends undici.Headers {}
  var Headers: typeof Headers;

  interface File extends undici.File {}
  var File: typeof File;

  interface Headers extends undici.Headers {}
  var Headers: typeof Headers;

  interface FormData extends undici.FormData {}
  var FormData: typeof FormData;

  /** @deprecated */
  var ExpoRequest: typeof Request;
  /** @deprecated */
  var ExpoResponse: typeof Response;
}

/** @deprecated */
export const ExpoRequest = Request;
/** @deprecated */
export const ExpoResponse = Response;

/** Use global polyfills from undici */
export function installGlobals(): void {
  // NOTE(@kitten): We defer requiring `undici` here
  // The require here is only fine as long as we only have CommonJS entrypoints
  const {
    File: undiciFile,
    fetch: undiciFetch,
    FormData: undiciFormData,
    Headers: undiciHeaders,
    Request: undiciRequest,
    Response: undiciResponse,
  } = require('undici');
  globalThis.File = undiciFile;
  globalThis.Headers = undiciHeaders;
  globalThis.Request = undiciRequest;
  globalThis.Response = undiciResponse;
  globalThis.fetch = undiciFetch;
  globalThis.FormData = undiciFormData;

  // Add deprecated globals for `Expo` aliased classes
  globalThis.ExpoRequest = undiciRequest;
  globalThis.ExpoResponse = undiciResponse;
}
