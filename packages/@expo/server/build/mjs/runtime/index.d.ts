import { RequestAPI } from './api';
export interface RequestAPISetup extends RequestAPI {
    origin?: string;
    environment?: string | null;
    waitUntil?(promise: Promise<unknown>): void;
}
type RequestContextFactory = (...args: any[]) => Partial<RequestAPISetup>;
type RequestScopeRunner<F extends RequestContextFactory> = (fn: (...args: Parameters<F>) => Promise<Response>, ...args: Parameters<F>) => Promise<Response>;
export declare function createRequestScope<F extends RequestContextFactory>(makeRequestAPISetup: F): RequestScopeRunner<F>;
export {};
