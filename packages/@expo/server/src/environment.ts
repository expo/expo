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
  // @ts-expect-error
  global.fetch = fetch;
  // @ts-expect-error
  global.Blob = Blob;
  // @ts-expect-error
  global.Body = Body;
  // @ts-expect-error
  global.Headers = Headers;

  // @ts-expect-error
  global.HeaderInit = HeaderInit;
  // @ts-expect-error
  global.HeadersInit = HeadersInit;
  // @ts-expect-error
  global.Request = Request;
  // @ts-expect-error
  global.Response = ExpoResponse;
  // @ts-expect-error
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

export class ExpoRequest extends Request {}
