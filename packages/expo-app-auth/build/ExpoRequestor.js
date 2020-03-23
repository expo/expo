import { AppAuthError, Requestor } from '@openid/appauth';
import { URL, URLSearchParams } from './URL';
/**
 * Extends Requester
 */
export class ExpoRequestor extends Requestor {
    createRequest(settings) {
        if (!settings.url) {
            throw new AppAuthError('A URL must be provided.');
        }
        let url = new URL(settings.url);
        const requestInit = {
            method: settings.method,
            mode: 'cors',
        };
        if (settings.data) {
            if (settings.method?.toUpperCase() === 'POST') {
                requestInit.body = settings.data;
            }
            else {
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
                    requestInit.headers[i] = settings.headers[i];
                }
            }
        }
        const isJsonDataType = settings.dataType?.toLowerCase() === 'json';
        // Set 'Accept' header value for json requests (Taken from
        // https://github.com/jquery/jquery/blob/e0d941156900a6bff7c098c8ea7290528e468cf8/src/ajax.js#L644
        // )
        if (isJsonDataType) {
            requestInit.headers['Accept'] = 'application/json, text/javascript, */*; q=0.01';
        }
        return { init: requestInit, isJsonDataType, url };
    }
    async xhr(settings) {
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
//# sourceMappingURL=ExpoRequestor.js.map