import { ExpoFetchModule } from './ExpoFetchModule';
import { getRequestBodyInit } from './ExpoRequest';
import { FetchError } from './FetchErrors';
import { FetchResponse, type AbortSubscriptionCleanupFunction } from './FetchResponse';
import type { NativeRequest, NativeRequestInit } from './NativeRequest';
import {
  normalizeBodyInitAsync,
  normalizeHeadersInit,
  overrideHeaders,
  normalizeMethod,
} from './RequestUtils';
import type { FetchRequestInit, FetchRequestLike } from './fetch.types';

/** Returns if `input` is a Request object */
const isRequest = (input: any): input is FetchRequestLike => {
  if (input == null || typeof input !== 'object') {
    return false;
  } else {
    // `_bodyInit` identifies a whatwg-fetch Request, which has neither `body` nor a string tag.
    return (
      'body' in input ||
      '_bodyInit' in input ||
      input instanceof Request ||
      input[Symbol.toStringTag] === 'Request'
    );
  }
};

// TODO(@kitten): Do we really want to use our own types for web standards?
export async function fetch(
  input: string | URL | FetchRequestLike,
  init?: FetchRequestInit
): Promise<FetchResponse> {
  const initFromRequest = isRequest(input);
  const url = initFromRequest ? input.url : input;
  const body =
    (init != null ? getRequestBodyInit(init) : null) ??
    (initFromRequest ? getRequestBodyInit(input) : null);
  const signal = init?.signal ?? (initFromRequest ? input.signal : undefined);
  const redirect = init?.redirect ?? (initFromRequest ? input.redirect : undefined);
  const method = init?.method ?? (initFromRequest ? input.method : undefined);

  let credentials = init?.credentials ?? (initFromRequest ? input.credentials : undefined);
  if (credentials === 'same-origin') {
    credentials = 'include';
  }

  let headers = normalizeHeadersInit(
    init?.headers ?? (initFromRequest ? input.headers : undefined)
  );

  let abortSubscription: AbortSubscriptionCleanupFunction | null = null;

  const response = new FetchResponse(() => {
    abortSubscription?.();
  });

  const request = new ExpoFetchModule.NativeRequest(response) as NativeRequest;

  const { body: requestBody, overriddenHeaders } = await normalizeBodyInitAsync(body);
  if (overriddenHeaders) {
    headers = overrideHeaders(headers, overriddenHeaders);
  }

  const nativeRequestInit: NativeRequestInit = {
    credentials: credentials ?? 'include',
    headers,
    method: method != null ? normalizeMethod(method) : 'GET',
    redirect: redirect ?? 'follow',
  };

  if (signal && signal.aborted) {
    throw new FetchError('The operation was aborted.', { cause: signal.reason });
  }
  abortSubscription = addAbortSignalListener(signal, () => {
    // Abort the body stream before canceling the native request, so late
    // native events can't reach an abandoned controller.
    response.abort(signal?.reason);
    request.cancel();
  });
  try {
    await request.start(`${url}`, nativeRequestInit, requestBody);
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw FetchError.createFromError(e);
    } else {
      throw new FetchError(String(e));
    }
  }
  return response;
}

/**
 * A wrapper of `AbortSignal.addEventListener` that returns a cleanup function.
 */
function addAbortSignalListener(
  signal: AbortSignal | undefined,
  listener: Parameters<AbortSignal['addEventListener']>[1]
): AbortSubscriptionCleanupFunction {
  signal?.addEventListener('abort', listener);
  return () => {
    signal?.removeEventListener('abort', listener);
  };
}
