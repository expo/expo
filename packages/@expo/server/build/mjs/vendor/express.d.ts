import type * as express from 'express';
import { type RequestHandlerParams } from './abstract';
export { ExpoError } from './abstract';
export type RequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
    environment?: string | null;
}, setup?: Partial<RequestHandlerParams>): RequestHandler;
export declare function convertHeaders(requestHeaders: express.Request['headers']): Headers;
export declare function convertRequest(req: express.Request, res: express.Response): Request;
export declare function respond(res: express.Response, expoRes: Response): Promise<void>;
