import type { Manifest, MiddlewareInfo, Route } from '../../manifest';
interface EnvironmentInput {
    readText(request: string): Promise<string | null>;
    readJson(request: string): Promise<unknown>;
    loadModule(request: string): Promise<unknown>;
    isDevelopment: boolean;
}
export interface CommonEnvironment {
    getRoutesManifest(): Promise<Manifest | null>;
    getHtml(request: Request, route: Route): Promise<string | Response | null>;
    getApiRoute(route: Route): Promise<unknown>;
    getMiddleware(middleware: MiddlewareInfo): Promise<any>;
    getLoaderData(request: Request, route: Route): Promise<Response>;
    preload(): Promise<void>;
}
export declare function createEnvironment(input: EnvironmentInput): CommonEnvironment;
export {};
