/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export class NetworkError extends Error {
  code = 'NETWORK_ERROR';

  constructor(
    message: string,
    public url: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class MetroServerError extends Error {
  code = 'METRO_SERVER_ERROR';

  constructor(
    errorObject: { message: string } & Record<string, any>,
    public url: string
  ) {
    super(errorObject.message);
    this.name = 'MetroServerError';

    for (const key in errorObject) {
      (this as any)[key] = errorObject[key];
    }
  }
}

export class ReactServerError extends Error {
  code = 'REACT_SERVER_ERROR';

  constructor(
    message: string,
    public url: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ReactServerError';
  }
}

export function patchErrorBox() {
  if (typeof ErrorUtils === 'undefined') {
    return;
  }
  //// This appears to never be called. Mostly LogBox is presented from an invasive patch on console.error.
  const globalHandler = ErrorUtils.getGlobalHandler();

  if (globalHandler?.__router_errors_patched) {
    return;
  }

  const routerHandler = (error: any) => {
    if (
      error instanceof NetworkError ||
      error instanceof MetroServerError ||
      error instanceof ReactServerError
    ) {
      // Use root error boundary.
      return;
    }
    globalHandler?.(error);
  };
  routerHandler.__router_errors_patched = true;

  ErrorUtils.setGlobalHandler(routerHandler);
}

// Add error handling that is used in the ErrorBoundary
export function patchFetch() {
  patchErrorBox();
  // @ts-expect-error
  if (globalThis.fetch.__router_errors_patched) {
    return;
  }

  const originalFetch = globalThis.fetch;

  Object.defineProperty(global, 'fetch', {
    // value: fetch,
    value: async function fetch(input: URL | RequestInfo, init?: RequestInit) {
      //   throw new NetworkError('test error', input as string);

      try {
        return await originalFetch(input, init);
      } catch (error: any) {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        if (error instanceof Error) {
          // Based on community fetch polyfill error message.
          if (
            error.message.match(
              /Network request failed: (The network connection was lost|Could not connect to the server)/
            )
          ) {
            throw new NetworkError(error.message, url);
          }
        }
        throw error;
      }
    },
  });

  // @ts-expect-error
  globalThis.fetch.__router_errors_patched = true;
}
