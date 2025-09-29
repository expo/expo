export { StatusError } from './error';
export interface RequestAPI {
    origin?: string;
    environment?: string | null;
    waitUntil?(promise: Promise<unknown>): void;
    deferTask?(fn: () => Promise<unknown>): void;
}
/** Returns the current request's origin URL
 * @remarks
 * This returns the request's Origin header, which contains the
 * request origin URL or defaults to `null`.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin
 */
export declare function origin(): string | null;
/** Returns the currently specified "environment", if any is set up.
 * @remarks
 * The request's environment. When this is `null`, this by convention typically
 * signifies the production environment. This is typically customized via the
 * Expo server adapters, and will default to the current `alias` name in
 * EAS Hosting.
 */
export declare function environment(): string | null;
/** Runs a task immediately and instructs the runtime to complete the task.
 * @remarks
 * Running a promise concurrently to the request doesn't usually guarantee that your
 * serverless function will continue executing the task. Passing the task to `runTask`
 * will attempt to keep the current invocation running until the task is completed.
 */
export declare function runTask(fn: () => Promise<unknown>): void;
/** Defers a task until after a response has been sent.
 * @remarks
 * After a response has been sent, if no error occurred, the tasks passed to `deferTask`
 * will be executed and the serverless function will be instructed to continue executing
 * the task until it has completed.
 */
export declare function deferTask(fn: () => Promise<unknown>): void;
