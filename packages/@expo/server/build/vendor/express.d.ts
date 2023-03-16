import type * as express from 'express';
import { Headers } from 'node-fetch';
import { ExpoRequest, ExpoResponse } from '../environment';
export type RequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}): RequestHandler;
export declare function convertHeaders(requestHeaders: express.Request['headers']): Headers;
export declare function convertRequest(req: express.Request, res: express.Response): ExpoRequest;
export declare function respond(res: express.Response, expoRes: ExpoResponse): Promise<void>;
