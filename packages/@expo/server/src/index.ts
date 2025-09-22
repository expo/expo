/**
 * @deprecated Use Fetch API `Request` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request)
 */
type ExpoRequest = Request;

/**
 * @deprecated Use Fetch API `Response` instead.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response)
 */
type ExpoResponse = Request;

export { ExpoRequest, ExpoResponse };
export { ExpoError } from './error';
export { type MiddlewareFunction } from './types';
