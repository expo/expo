import { ExpoResponse } from './environment';
import { ServerRequest } from './server.types';
export declare function getStaticMiddleware(root: string): (req: ServerRequest, res: ExpoResponse, next: any) => any;
