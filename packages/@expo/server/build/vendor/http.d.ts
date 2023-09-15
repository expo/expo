/// <reference types="node" />
import { Headers } from '@remix-run/node';
import * as http from 'http';
import { createRequestHandler as createExpoHandler } from '..';
import { ExpoRequest, ExpoResponse } from '../environment';
type NextFunction = (err?: any) => void;
export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => Promise<void>;
/**
 * Returns a request handler for http that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}, setup?: Parameters<typeof createExpoHandler>[1]): RequestHandler;
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): ExpoRequest;
export declare function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers;
export declare function respond(res: http.ServerResponse, expoRes: ExpoResponse): Promise<void>;
export {};
