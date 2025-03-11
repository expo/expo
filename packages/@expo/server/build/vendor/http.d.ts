/// <reference types="node" />
import * as http from 'http';
import { createRequestHandler as createExpoHandler } from '../index';
type NextFunction = (err?: any) => void;
export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => Promise<void>;
/**
 * Returns a request handler for http that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}, setup?: Parameters<typeof createExpoHandler>[1]): RequestHandler;
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request;
export declare function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers;
declare module 'http' {
    interface ServerResponse {
        /** @since v19.6.0, v18.15.0 */
        setHeaders?(headers: Headers | Map<string, number | string | readonly string[]>): this;
    }
}
export declare function respond(res: http.ServerResponse, expoRes: Response): Promise<void>;
export {};
