import { Manifest, Route } from '../types';
export declare const handleRouteError: () => (error: Error) => Promise<never>;
export declare const getRoutesManifest: (dist: string) => () => Promise<Manifest | null>;
export declare const getHtml: (dist: string) => (_request: Request, route: Route) => Promise<string | null>;
export declare const getApiRoute: (dist: string) => (route: Route) => any;
