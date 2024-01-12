/// <reference types="node" />
import { Headers } from '@remix-run/node';
import * as http from 'http';
import { ExpoRequest, ExpoResponse } from '../environment';
export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}): RequestHandler;
export declare function convertHeaders(requestHeaders: http.IncomingMessage['headers']): Headers;
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): ExpoRequest;
export declare function respond(res: http.ServerResponse, expoRes: ExpoResponse): Promise<void>;
