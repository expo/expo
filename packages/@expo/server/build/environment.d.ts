/// <reference types="node" />
import { Request, RequestInfo, RequestInit, Response, ResponseInit } from '@remix-run/node';
import { URL } from 'node:url';
import { ExpoRouterServerManifestV1FunctionRoute } from './types';
export declare function installGlobals(): void;
export declare class ExpoResponse extends Response {
    static json(data?: any, init?: ResponseInit): ExpoResponse;
}
export declare const NON_STANDARD_SYMBOL: unique symbol;
export declare class ExpoURL extends URL {
    static from(url: string, config: ExpoRouterServerManifestV1FunctionRoute): ExpoURL;
}
export declare class ExpoRequest extends Request {
    [NON_STANDARD_SYMBOL]: {
        url: ExpoURL;
    };
    constructor(info: RequestInfo, init?: RequestInit);
    get expoUrl(): ExpoURL;
}
