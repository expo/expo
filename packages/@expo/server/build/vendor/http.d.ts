/// <reference types="node" />
import * as http from 'http';
import { ExpoRequest, ExpoResponse } from '../environment';
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): ExpoRequest;
export declare function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers;
export declare function respond(res: http.ServerResponse, expoRes: ExpoResponse): Promise<void>;
