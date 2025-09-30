import * as http from 'http';
export { ExpoError } from './abstract';
export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
}): RequestHandler;
export declare function convertHeaders(requestHeaders: http.IncomingMessage['headers']): Headers;
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request;
export declare function respond(res: http.ServerResponse, expoRes: Response): Promise<void>;
