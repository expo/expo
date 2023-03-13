import fetch, {
  Blob,
  Body,
  BodyInit,
  HeaderInit,
  Headers,
  HeadersInit,
  Request,
  Response,
} from 'node-fetch';

// Ensure these are available for the API Routes.
export function installGlobals() {
  global.fetch = fetch;
  global.Blob = Blob;
  global.Body = Body;
  global.Headers = Headers;

  global.HeaderInit = HeaderInit;
  global.HeadersInit = HeadersInit;
  global.Request = Request;
  global.Response = ExpoResponse;
  global.BodyInit = BodyInit;
}

export class ExpoResponse extends Response {
  // TODO: Drop when we upgrade to node-fetch v3
  static json(data: any = undefined, init: ResponseInit = {}): ExpoResponse {
    const body = JSON.stringify(data);

    if (body === undefined) {
      throw new TypeError('data is not JSON serializable');
    }

    // @ts-expect-error
    const headers = new Headers(init?.headers);

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    return new ExpoResponse(body, {
      ...init,
      headers,
    });
  }
}
