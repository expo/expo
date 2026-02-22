export interface Limiter {
    <Arguments extends unknown[], ReturnType>(fn: (...args: Arguments) => PromiseLike<ReturnType> | ReturnType, ...args: Arguments): Promise<ReturnType>;
}
export declare const createLimiter: (limit?: number) => Limiter;
