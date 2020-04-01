import { AppAuthError, Requestor } from '@openid/appauth';

import { URL, URLSearchParams } from './URL';

/**
 * Extends Requester
 */
export class ExpoRequestor extends Requestor {
  // Set 'Accept' header value for json requests
  // (Taken from https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644)
  getJsonHeaders(): string {
    // WARNING: Github authentication will return XML if this includes the standard `*/*`
    // we'll remove the */* property for now. Override this class in the future if it has problems.
    // https://github.com/expo/expo/pull/3828/files
    return 'application/json, text/javascript; q=0.01';
    // return 'application/json, text/javascript, */*; q=0.01';
  }

  createRequest(
    settings: JQueryAjaxSettings
  ): { init: RequestInit; url: URL; isJsonDataType: boolean } {
    if (!settings.url) {
      throw new AppAuthError('A URL must be provided.');
    }
    const url: URL = new URL(settings.url as string);
    const requestInit: RequestInit = {
      method: settings.method,
      mode: 'cors',
    };

    if (settings.data) {
      if (settings.method?.toUpperCase() === 'POST') {
        requestInit.body = settings.data as string;
      } else {
        const searchParams = new URLSearchParams(settings.data);
        searchParams.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }
    }

    // Set the request headers
    requestInit.headers = {};
    if (settings.headers) {
      for (const i in settings.headers) {
        if (i in settings.headers) {
          requestInit.headers[i] = settings.headers[i] as string;
        }
      }
    }

    const isJsonDataType = settings.dataType?.toLowerCase() === 'json';

    if (isJsonDataType && !('Accept' in requestInit.headers)) {
      requestInit.headers['Accept'] = this.getJsonHeaders();
    }
    return { init: requestInit, isJsonDataType, url };
  }

  async xhr<T>(settings: JQueryAjaxSettings): Promise<T> {
    const { init, isJsonDataType, url } = this.createRequest(settings);
    const response = await fetch(url.toString(), init);

    const contentType = response.headers.get('content-type');
    if (isJsonDataType || contentType?.includes('application/json')) {
      return response.json();
    }
    // @ts-ignore: Type 'string' is not assignable to type 'T'.
    return response.text();
  }
}
