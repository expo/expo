import type { HandlerEvent, HandlerResponse } from '@netlify/functions';
export { ExpoError } from './abstract';
export declare function createRequestHandler(params: {
    build: string;
}): (event: HandlerEvent) => Promise<HandlerResponse>;
export declare function respond(res: Response): Promise<HandlerResponse>;
export declare function createHeaders(requestHeaders: HandlerEvent['multiValueHeaders']): Headers;
export declare function convertRequest(event: HandlerEvent): Request;
export declare function isBinaryType(contentType: string | null | undefined): boolean;
