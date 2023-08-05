/// <reference types="node" />
import '@expo/server/install';
import { Headers } from '@remix-run/node';
import * as http from 'http';
import { ExpoRequest, ExpoResponse } from '../environment';
import { ExpoRouterServerManifestV1FunctionRoute } from '../types';
export declare function convertRequest(req: http.IncomingMessage, res: http.ServerResponse, routeConfig: ExpoRouterServerManifestV1FunctionRoute): ExpoRequest;
export declare function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers;
export declare function respond(res: http.ServerResponse, expoRes: ExpoResponse): Promise<void>;
