export { StatusError } from './error';
/** Returns the current request's origin URL.
 *
 * This typically returns the request's `Origin` header, which contains the
 * request origin URL or defaults to `null`.
 * @returns A request origin
 */
export declare function origin(): string | null;
/** Returns the request's environment, if the server runtime supports this.
 *
 * In EAS Hosting, the returned environment name is the
 * [alias or deployment identifier](https://docs.expo.dev/eas/hosting/deployments-and-aliases/),
 * but the value may differ for other providers.
 *
 * @returns A request environment name, or `null` for production.
 */
export declare function environment(): string | null;
/** Runs a task immediately and instructs the runtime to complete the task.
 *
 * A request handler may be terminated as soon as the client has finished the full `Response`
 * and unhandled promise rejections may not be logged properly. To run tasks concurrently to
 * a request handler and keep the request alive until the task is completed, pass a task
 * function to `runTask` instead. The request handler will be kept alive until the task
 * completes.
 *
 * @param fn - A task function to execute. The request handler will be kept alive until this task finishes.
 */
export declare function runTask(fn: () => Promise<unknown>): void;
/** Defers a task until after a response has been sent.
 *
 * This only calls the task function once the request handler has finished resolving a `Response`
 * and keeps the request handler alive until the task is completed. This is useful to run non-critical
 * tasks after the request handler, for example to log analytics datapoints. If the request handler
 * rejects with an error, deferred tasks won't be executed.
 *
 * @param fn - A task function to execute after the request handler has finished.
 */
export declare function deferTask(fn: () => Promise<unknown>): void;
