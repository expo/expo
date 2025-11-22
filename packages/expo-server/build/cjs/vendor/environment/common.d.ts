import type { Manifest, MiddlewareInfo, Route } from '../../manifest';
interface EnvironmentInput {
    readText(request: string): Promise<string | null>;
    readJson(request: string): Promise<unknown>;
    loadModule(request: string): Promise<unknown>;
}
export declare function createEnvironment(input: EnvironmentInput): {
    getRoutesManifest(): Promise<Manifest>;
    getHtml(_request: Request, route: Route): Promise<string | Response | null>;
    getApiRoute(route: Route): Promise<unknown>;
    getMiddleware(middleware: MiddlewareInfo): Promise<any>;
};
export {};
