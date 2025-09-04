"use strict";
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.ReactServerError = exports.MetroServerError = void 0;
class MetroServerError extends Error {
    url;
    code = 'METRO_SERVER_ERROR';
    constructor(errorObject, url) {
        super(errorObject.message);
        this.url = url;
        this.name = 'MetroServerError';
        for (const key in errorObject) {
            this[key] = errorObject[key];
        }
    }
}
exports.MetroServerError = MetroServerError;
class ReactServerError extends Error {
    url;
    statusCode;
    headers;
    code = 'REACT_SERVER_ERROR';
    constructor(message, url, statusCode, 
    /** Response headers from the server. */
    headers) {
        super(message);
        this.url = url;
        this.statusCode = statusCode;
        this.headers = headers;
        this.name = 'ReactServerError';
    }
}
exports.ReactServerError = ReactServerError;
class NetworkError extends Error {
    url;
    code = 'NETWORK_ERROR';
    constructor(message, url) {
        super(message);
        this.url = url;
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
//# sourceMappingURL=errors.js.map