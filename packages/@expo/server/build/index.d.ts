import { ServerNext, ServerRequest, ServerResponse } from './server.types';
export declare function createRequestHandler(distFolder: string): (request: ServerRequest, response: ServerResponse, next?: ServerNext) => Promise<any>;
