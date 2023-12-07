import {
  installGlobals as installRemixGlobals,
  Request,
  RequestInfo,
  RequestInit,
  Response,
  ResponseInit,
  Headers,
} from '@remix-run/node';
import { URL } from 'node:url';

import { ExpoRouterServerManifestV1FunctionRoute } from './types';

// Ensure these are available for the API Routes.
export function installGlobals() {
  installRemixGlobals();

  // @ts-expect-error
  global.Request = ExpoRequest;
  // @ts-expect-error
  global.Response = ExpoResponse;
  // @ts-expect-error
  global.ExpoResponse = ExpoResponse;
  // @ts-expect-error
  global.ExpoRequest = ExpoRequest;
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

export const NON_STANDARD_SYMBOL = Symbol('non-standard');

export class ExpoURL extends URL {
  static from(url: string, config: ExpoRouterServerManifestV1FunctionRoute): ExpoURL {
    const expoUrl = new ExpoURL(url);
    const match = config.namedRegex.exec(expoUrl.pathname);
    if (match?.groups) {
      for (const [key, value] of Object.entries(match.groups)) {
        const namedKey = config.routeKeys[key];
        expoUrl.searchParams.set(namedKey, value);
      }
    }

    return expoUrl;
  }
}

export class ExpoRequest extends Request {
  [NON_STANDARD_SYMBOL]: {
    url: ExpoURL;
  };

  constructor(info: RequestInfo, init?: RequestInit) {
    super(info, init);

    this[NON_STANDARD_SYMBOL] = {
      url: new ExpoURL(typeof info !== 'string' && 'url' in info ? info.url : String(info)),
    };
  }

  public get expoUrl() {
    return this[NON_STANDARD_SYMBOL].url;
  }
}
