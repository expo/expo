import * as http from 'http';
import { type RequestHandlerInput as ExpoRequestHandlerInput, type RequestHandlerParams as ExpoRequestHandlerParams } from './abstract';
export { ExpoError } from './abstract';
type NextFunction = (err?: any) => void;
export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => Promise<void>;
export interface RequestHandlerParams extends ExpoRequestHandlerParams, Partial<ExpoRequestHandlerInput> {
    handleRouteError?(error: Error): Promise<Response>;
}
/**
 * Returns a request handler for http that serves the response using Remix.
 */
export declare function createRequestHandler(params: {
    build: string;
    environment?: string | null;
}, setup?: Partial<RequestHandlerParams>): RequestHandler;
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request;
export declare function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers;
export declare function respond(res: http.ServerResponse, expoRes: Response): Promise<void>;
