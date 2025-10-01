export type { MiddlewareFunction } from 'expo-server';

/**
 * @deprecated Use Fetch API `Request` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request)
 */
export type ExpoRequest = Request;

/**
 * @deprecated Use Fetch API `Response` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response)
 */
export type ExpoResponse = Response;

export type RequestHandler = (
  request: Request,
  params: Record<string, string>
) => Response | Promise<Response>;
