import { type CommonEnvironment } from './common';
import type { ScopeDefinition } from '../../runtime/scope';
interface WorkerdEnvParams {
    build?: string;
    environment?: string | null;
    isDevelopment?: boolean;
}
export declare function createWorkerdEnv(params: WorkerdEnvParams): CommonEnvironment;
export interface ExecutionContext {
    waitUntil?(promise: Promise<any>): void;
    props?: any;
}
export declare function createWorkerdRequestScope<Env = unknown>(scopeDefinition: ScopeDefinition, params: WorkerdEnvParams): (fn: (request: Request, _env: Env, ctx: ExecutionContext) => Promise<Response>, request: Request, _env: Env, ctx: ExecutionContext) => Promise<Response>;
export {};
