interface WorkerdEnvParams {
    build: string;
}
export declare function createWorkerdEnv(params: WorkerdEnvParams): {
    getRoutesManifest(): Promise<import("../../manifest").Manifest>;
    getHtml(_request: Request, route: import("../../manifest").Route): Promise<string | Response | null>;
    getApiRoute(route: import("../../manifest").Route): Promise<unknown>;
    getMiddleware(middleware: import("../../manifest").MiddlewareInfo): Promise<any>;
    handleRouteError(error: Error): Promise<Response>;
};
export {};
