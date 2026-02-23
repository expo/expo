import { type CommonEnvironment } from './common';
import type { ScopeDefinition } from '../../runtime/scope';
interface NodeEnvParams {
    build: string;
    environment?: string | null;
    isDevelopment?: boolean;
}
export declare function createNodeEnv(params: NodeEnvParams): CommonEnvironment;
export declare function createNodeRequestScope(scopeDefinition: ScopeDefinition, params: NodeEnvParams): (fn: (request: Request) => Promise<Response>, request: Request) => Promise<Response>;
export {};
