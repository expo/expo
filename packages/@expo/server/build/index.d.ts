import { ExpoResponse } from './environment';
import { ServerNext, ServerRequest } from './server.types';
export declare function createRequestHandler(distFolder: string): (request: ServerRequest, response: ExpoResponse, next?: ServerNext) => Promise<any>;
