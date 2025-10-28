import type { ScopeDefinition } from '../../runtime/scope';
interface NodeEnvParams {
    build: string;
    environment?: string | null;
}
export declare function createNodeEnv(params: NodeEnvParams): {
    getRoutesManifest(): Promise<import("../../manifest").Manifest>;
    getHtml(_request: Request, route: import("../../manifest").Route): Promise<string | Response | null>;
    getApiRoute(route: import("../../manifest").Route): Promise<unknown>;
    getMiddleware(middleware: import("../../manifest").MiddlewareInfo): Promise<any>;
};
export declare function createNodeRequestScope(scopeDefinition: ScopeDefinition, params: NodeEnvParams): (fn: (request: Request) => Promise<Response>, request: Request) => Promise<Response>;
export {};
