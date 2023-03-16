import { installGlobals as installRemixGlobals, Response, Request } from '@remix-run/node';

// Ensure these are available for the API Routes.
export function installGlobals() {
  installRemixGlobals();

  // @ts-expect-error
  global.Request = ExpoRequest;
  // @ts-expect-error
  global.Response = ExpoResponse;
}

export class ExpoResponse extends Response {
  // TODO: Drop when we upgrade to node-fetch v3
  static json(data: any = undefined, init: ResponseInit = {}): ExpoResponse {
    const body = JSON.stringify(data);

    if (body === undefined) {
      throw new TypeError('data is not JSON serializable');
    }

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
