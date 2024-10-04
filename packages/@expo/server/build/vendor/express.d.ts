import { Headers, Response } from '@remix-run/node';
import type * as express from 'express';
import { createRequestHandler as createExpoHandler } from '..';
import { ExpoRequest } from '../environment';
export type RequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}, setup?: Parameters<typeof createExpoHandler>[1]): RequestHandler;
export declare function convertHeaders(requestHeaders: express.Request['headers']): Headers;
export declare function convertRequest(req: express.Request, res: express.Response): ExpoRequest;
export declare function respond(res: express.Response, expoRes: Response): Promise<void>;
