import type * as express from 'express';
import { type RequestHandlerInput as ExpoRequestHandlerInput, type RequestHandlerParams as ExpoRequestHandlerParams } from './abstract';
export { ExpoError } from './abstract';
export type RequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
export interface RequestHandlerParams extends ExpoRequestHandlerParams, Partial<ExpoRequestHandlerInput> {
    handleRouteError?(error: Error): Promise<Response>;
}
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
    environment?: string | null;
}, setup?: RequestHandlerParams): RequestHandler;
export { convertRequest, respond } from './http';
