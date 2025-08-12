import { Route } from './types';
export declare function isResponse(input: unknown): input is Response;
export declare function parseParams(request: Request, route: Route): Record<string, string>;
export declare function getRedirectRewriteLocation(url: URL, request: Request, route: Route): URL;
