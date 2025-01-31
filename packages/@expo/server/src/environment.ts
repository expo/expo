/* eslint-disable no-var */
import './assertion';

declare const Response: {
  prototype: Response;
  new (body?: BodyInit | null, init?: ResponseInit): Response;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/error_static) */
  error(): Response;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/json_static) */
  json(data: any, init?: ResponseInit): Response;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/redirect_static) */
  redirect(url: string | URL, status?: number): Response;
};

declare global {
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
function installNativeFetchGlobals() {
  // NOTE(@kitten): We defer requiring `undici` here
  // The require here is only fine as long as we only have CommonJS entrypoints
  const {
    File: undiciFile,
    fetch: undiciFetch,
    FormData: undiciFormData,
    Headers: undiciHeaders,
    Request: undiciRequest,
    Response: undiciResponse
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

export function installGlobals() {
  installNativeFetchGlobals();

  if (typeof Response.error !== 'function') {
    Response.error = function error() {
      return new Response(null, { status: 500 });
    };
  }

  if (typeof Response.json !== 'function') {
    Response.json = function json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), init);
    };
  }

  if (typeof Response.redirect !== 'function') {
    Response.redirect = function redirect(url: string | URL, status?: number) {
      if (!status) status = 302;
      switch (status) {
        case 301:
        case 302:
        case 303:
        case 307:
        case 308:
          return new Response(null, {
            headers: { Location: new URL(url).toString() },
            status,
          });
        default:
          throw new RangeError(`Invalid status code ${status}`);
      }
    };
  }
}
