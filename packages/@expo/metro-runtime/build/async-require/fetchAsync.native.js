/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Platform } from 'react-native';
// @ts-expect-error
import Networking from 'react-native/Libraries/Network/RCTNetworking';
export function fetchAsync(url) {
    let id = null;
    let responseText = null;
    let headers = {};
    let dataListener = null;
    let completeListener = null;
    let responseListener = null;
    return new Promise((resolve, reject) => {
        const addListener = Networking.addListener;
        dataListener = addListener('didReceiveNetworkData', ([requestId, response]) => {
            if (requestId === id) {
                responseText = response;
            }
        });
        responseListener = addListener('didReceiveNetworkResponse', ([requestId, status, responseHeaders]) => {
            if (requestId === id) {
                headers = responseHeaders;
            }
        });
        completeListener = addListener('didCompleteNetworkResponse', ([requestId, error]) => {
            if (requestId === id) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({ body: responseText, headers });
                }
            }
        });
        Networking.sendRequest('GET', 'asyncRequest', url, {
            'expo-platform': Platform.OS,
        }, '', 'text', false, 0, (requestId) => {
            id = requestId;
        }, true);
    }).finally(() => {
        dataListener?.remove();
        completeListener?.remove();
        responseListener?.remove();
    });
}
//# sourceMappingURL=fetchAsync.native.js.map