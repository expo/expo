export interface Limiter {
    <Arguments extends unknown[], ReturnType>(fn: (...args: Arguments) => PromiseLike<ReturnType> | ReturnType, ...args: Arguments): Promise<ReturnType>;
}
export declare const createLimiter: (limit: number) => Limiter;
export declare const taskAll: <T, R>(inputs: T[], map: (input: T) => Promise<R>) => Promise<R[]>;
