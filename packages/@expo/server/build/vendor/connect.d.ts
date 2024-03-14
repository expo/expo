/// <reference types="node" />
import type * as connect from 'connect';
import type * as http from 'http';
import { createRequestHandler as createExpoHandler } from '..';
export type RequestHandler = connect.NextHandleFunction;
/**
 * Returns a request handler for Connect that serves the response using Remix.
 */
export declare function createRequestHandler({ build }: {
    build: string;
}, setup?: Parameters<typeof createExpoHandler>[1]): RequestHandler;
export declare function convertRequest(req: connect.IncomingMessage, res: http.ServerResponse): Request;
export declare function respond(res: http.ServerResponse, expoRes: Response): Promise<void>;
