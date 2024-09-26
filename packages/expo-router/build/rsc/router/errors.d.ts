/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export declare class MetroServerError extends Error {
    url: string;
    code: string;
    constructor(errorObject: {
        message: string;
    } & Record<string, any>, url: string);
}
export declare class ReactServerError extends Error {
    url: string;
    statusCode: number;
    code: string;
    constructor(message: string, url: string, statusCode: number);
}
export declare class NetworkError extends Error {
    url: string;
    code: string;
    constructor(message: string, url: string);
}
//# sourceMappingURL=errors.d.ts.map