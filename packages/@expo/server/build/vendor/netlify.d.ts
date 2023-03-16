import { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Headers } from 'node-fetch';
import { ExpoRequest, ExpoResponse } from '../environment';
export declare function createRequestHandler({ build }: {
    build: string;
}): (event: HandlerEvent) => Promise<HandlerResponse>;
export declare function toNetlifyResponse(res: ExpoResponse): Promise<HandlerResponse>;
export declare function createHeaders(requestHeaders: HandlerEvent['multiValueHeaders']): Headers;
export declare function convertRequest(event: HandlerEvent): ExpoRequest;
export declare function isBinaryType(contentType: string | null | undefined): boolean;
