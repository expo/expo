interface WorkerdEnvParams {
    build?: string;
    environment?: string | null;
}
export declare function createWorkerdEnv(params: WorkerdEnvParams): {
    getRoutesManifest(): Promise<import("../../manifest").Manifest>;
    getHtml(_request: Request, route: import("../../manifest").Route): Promise<string | Response | null>;
    getApiRoute(route: import("../../manifest").Route): Promise<unknown>;
    getMiddleware(middleware: import("../../manifest").MiddlewareInfo): Promise<any>;
    handleRouteError(error: Error): Promise<Response>;
};
export interface ExecutionContext {
    waitUntil?(promise: Promise<any>): void;
    props?: any;
}
export declare function createWorkerdRequestScope<Env = unknown>(params: WorkerdEnvParams): (fn: (request: Request, _env: Env, ctx: ExecutionContext) => Promise<Response>, request: Request, _env: Env, ctx: ExecutionContext) => Promise<Response>;
export {};
