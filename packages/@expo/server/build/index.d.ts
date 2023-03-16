import { ExpoRequest } from './environment';
import 'source-map-support/register';
export declare function createRequestHandler(distFolder: string): (request: ExpoRequest) => Promise<import("node-fetch").Response | undefined>;
