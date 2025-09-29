import { type RequestHandlerParams } from './abstract';
export { ExpoError } from './abstract';
export type RequestHandler = (req: Request) => Promise<Response>;
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
}, setup?: Partial<RequestHandlerParams>): RequestHandler;
