"use strict";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAsync = void 0;
// @ts-expect-error
const RCTNetworking_1 = __importDefault(require("react-native/Libraries/Network/RCTNetworking"));
function fetchAsync(url) {
    let id = null;
    let statusCode = null;
    let responseText = null;
    let headers = {};
    let dataListener = null;
    let completeListener = null;
    let responseListener = null;
    return new Promise((resolve, reject) => {
        const addListener = RCTNetworking_1.default.addListener.bind(RCTNetworking_1.default);
        dataListener = addListener('didReceiveNetworkData', ([requestId, response]) => {
            if (requestId === id) {
                responseText = response;
            }
        });
        responseListener = addListener('didReceiveNetworkResponse', ([requestId, status, responseHeaders]) => {
            if (requestId === id) {
                statusCode = status;
                headers = responseHeaders;
            }
        });
        completeListener = addListener('didCompleteNetworkResponse', ([requestId, error]) => {
            if (requestId === id) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({ body: responseText, status: statusCode, headers });
                }
            }
        });
        RCTNetworking_1.default.sendRequest('GET', 'asyncRequest', url, {
            'expo-platform': process.env.EXPO_OS,
        }, '', 'text', false, 0, (requestId) => {
            id = requestId;
        }, true);
    }).finally(() => {
        dataListener?.remove();
        completeListener?.remove();
        responseListener?.remove();
    });
}
exports.fetchAsync = fetchAsync;
//# sourceMappingURL=fetchAsync.native.js.map