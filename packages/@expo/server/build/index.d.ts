import '@expo/server/install';
import { Response } from '@remix-run/node';
import { ExpoRequest, ExpoResponse } from './environment';
export declare function createRequestHandler(distFolder: string): (request: ExpoRequest) => Promise<Response>;
export { ExpoResponse, ExpoRequest };
