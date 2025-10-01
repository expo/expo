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
export class StatusError extends Error {
  status: number;
  body: string;

  constructor(status?: number, body?: { error?: string; [key: string]: any } | Error | string);
  constructor(status?: number, errorOptions?: { cause: unknown; error?: string });
  constructor(
    status?: number,
    body?: { error?: string; [key: string]: any } | Error | string,
    errorOptions?: { cause?: unknown }
  );
  constructor(
    status = 500,
    body?: { error?: string; [key: string]: any; cause?: unknown } | Error | string,
    errorOptions?: { cause?: unknown }
  ) {
    const cause =
      (errorOptions != null && errorOptions.cause) ??
      (body != null && typeof body === 'object' && body.cause != null ? body.cause : undefined);
    let message =
      typeof body === 'object' ? (body instanceof Error ? body.message : body.error) : body;
    if (message == null) {
      switch (status) {
        case 400:
          message = 'Bad Request';
          break;
        case 401:
          message = 'Unauthorized';
          break;
        case 403:
          message = 'Forbidden';
          break;
        case 404:
          message = 'Not Found';
          break;
        case 500:
          message = 'Internal Server Error';
          break;
        default:
          message = 'Unknown Error';
      }
    }
    super(message, cause ? { cause } : undefined);
    this.name = 'StatusError';
    this.status = status;
    if (body instanceof Error) {
      this.body = JSON.stringify({ error: body.message }, null, 2);
    } else {
      this.body =
        typeof body === 'object'
          ? JSON.stringify(body, null, 2)
          : (body ?? JSON.stringify({ error: message }, null, 2));
    }
  }
}

export function errorToResponse(error: Error): Response {
  if (error instanceof StatusError) {
    return new Response(error.body, {
      status: error.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } else if ('status' in error && typeof error.status === 'number') {
    const body =
      'body' in error && typeof error.body === 'string'
        ? error.body
        : JSON.stringify({ error: error.message }, null, 2);
    return new Response(body, {
      status: error.status,
    });
  } else {
    return new Response(`${error}`, { status: 500 });
  }
}
