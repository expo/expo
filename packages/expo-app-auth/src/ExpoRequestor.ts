import { AppAuthError, Requestor } from '@openid/appauth';
import { URL, URLSearchParams } from 'react-native-url-polyfill';

/**
 * Extends Requester
 */
export class ExpoRequestor extends Requestor {
  async xhr<T>(settings: JQueryAjaxSettings): Promise<T> {
    if (!settings.url) {
      throw new AppAuthError('A URL must be provided.');
    }
    let url: URL = new URL(settings.url as string);
    const requestInit: RequestInit = {
      method: settings.method,
      mode: 'cors',
    };

    if (settings.data) {
      if (settings.method && settings.method.toUpperCase() === 'POST') {
        requestInit.body = settings.data as string;
      } else {
        let searchParams = new URLSearchParams(settings.data);
        searchParams.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }
    }

    // Set the request headers
    requestInit.headers = {};
    if (settings.headers) {
      for (let i in settings.headers) {
        if (i in settings.headers) {
          requestInit.headers[i] = settings.headers[i] as string;
        }
      }
    }

    const isJsonDataType = settings.dataType && settings.dataType.toLowerCase() === 'json';

    // Set 'Accept' header value for json requests (Taken from
    // https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644
    // )
    if (isJsonDataType) {
      requestInit.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
    }

    const response = await fetch(url.toString(), requestInit);

    if (response.status >= 200 && response.status < 300) {
      const contentType = response.headers.get('content-type');
      if (isJsonDataType || (contentType && contentType.indexOf('application/json') !== -1)) {
        return response.json();
      }
      // @ts-ignore: Type 'string' is not assignable to type 'T'.
      return response.text();
    }
    throw new AppAuthError(response.status.toString(), response.statusText);
  }
}
