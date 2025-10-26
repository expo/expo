import { type RequestHandlerParams } from './abstract';
import { ExecutionContext } from './environment/workerd';
export { ExpoError } from './abstract';
export type RequestHandler<Env = unknown> = (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
/**
 * Returns a request handler for Workerd deployments.
 */
export declare function createRequestHandler<Env = unknown>(params: {
    build: string;
    environment?: string | null;
}, setup?: RequestHandlerParams): RequestHandler<Env>;
