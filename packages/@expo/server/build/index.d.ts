import { ExpoRequest, ExpoResponse } from './environment';
import 'source-map-support/register';
export declare function createRequestHandler(distFolder: string): (request: ExpoRequest) => Promise<ExpoResponse>;
