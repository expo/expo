import { Platform } from '@unimodules/core';
import qs from 'qs';
// TODO(Bacon): pending react-native-adapter publish after sdk 38
const isDOMAvailable = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !!window.document?.createElement &&
    // eslint-disable-next-line no-undef
    typeof URL !== 'undefined';
export async function requestAsync(requestUrl, fetchRequest) {
    if (Platform.OS === 'web' && !isDOMAvailable) {
        // @ts-ignore
        return;
    }
    // eslint-disable-next-line no-undef
    const url = new URL(requestUrl);
    const request = {
        method: fetchRequest.method,
        mode: 'cors',
        headers: {},
    };
    const isJsonDataType = fetchRequest.dataType?.toLowerCase() === 'json';
    if (fetchRequest.headers) {
        for (const i in fetchRequest.headers) {
            if (i in fetchRequest.headers) {
                request.headers[i] = fetchRequest.headers[i];
            }
        }
    }
    if (fetchRequest.body) {
        if (fetchRequest.method?.toUpperCase() === 'POST') {
            request.body = qs.stringify(fetchRequest.body);
        }
        else {
            for (const key of Object.keys(fetchRequest.body)) {
                url.searchParams.append(key, fetchRequest.body[key]);
            }
        }
    }
    if (isJsonDataType && !('Accept' in request.headers)) {
        // NOTE: Github authentication will return XML if this includes the standard `*/*`
        request.headers['Accept'] = 'application/json, text/javascript; q=0.01';
    }
    // Fix a problem with React Native `URL` causing a trailing slash to be added.
    const correctedUrl = url.toString().replace(/\/$/, '');
    const response = await fetch(correctedUrl, request);
    const contentType = response.headers.get('content-type');
    if (isJsonDataType || contentType?.includes('application/json')) {
        return response.json();
    }
    // @ts-ignore: Type 'string' is not assignable to type 'T'.
    return response.text();
}
//# sourceMappingURL=Fetch.js.map