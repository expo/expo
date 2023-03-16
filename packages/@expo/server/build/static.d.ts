import { ServerRequest, ServerResponse } from './server.types';
export declare function getStaticMiddleware(root: string): (req: ServerRequest, res: ServerResponse, next: any) => any;
