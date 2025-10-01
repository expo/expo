export { ExpoError } from './abstract';
declare const scopeSymbol: unique symbol;
interface NetlifyContext {
    deploy?: {
        context?: string | null;
    };
    site?: {
        url?: string | null;
    };
    waitUntil?: (promise: Promise<unknown>) => void;
    [scopeSymbol]?: unknown;
}
export declare function createRequestHandler(params: {
    build: string;
}): (req: Request, ctx?: NetlifyContext) => Promise<Response>;
