/** An error response representation which can be thrown anywhere in server-side code.
 *
 * A `StatusError` can be thrown by a request handler and will be caught by the `expo-server`
 * runtime and replaced by a `Response` with the `status` and `body` that's been passed to
 * the `StatusError`.
 *
 * @example
 * ```ts
 * import { StatusError } from 'expo-server';
 *
 * export function GET(request, { postId }) {
 *   if (!postId) {
 *     throw new StatusError(400, 'postId parameter is required');
 *   }
 * }
 * ```
 */
export declare class StatusError extends Error {
    status: number;
    body: string;
    constructor(status?: number, body?: {
        error?: string;
        [key: string]: any;
    } | Error | string);
    constructor(status?: number, errorOptions?: {
        cause: unknown;
        error?: string;
    });
    constructor(status?: number, body?: {
        error?: string;
        [key: string]: any;
    } | Error | string, errorOptions?: {
        cause?: unknown;
    });
}
export declare function errorToResponse(error: Error): Response;
