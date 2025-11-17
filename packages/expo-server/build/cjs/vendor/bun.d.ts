import { type RequestHandlerInput as ExpoRequestHandlerInput, type RequestHandlerParams as ExpoRequestHandlerParams } from './abstract';
export { ExpoError } from './abstract';
export type RequestHandler = (req: Request) => Promise<Response>;
export interface RequestHandlerParams extends ExpoRequestHandlerParams, Partial<ExpoRequestHandlerInput> {
}
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
    environment?: string | null;
}, setup?: RequestHandlerParams): RequestHandler;
