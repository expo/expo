import { ExpoFetchModule } from './ExpoFetchModule';
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
    return 'body' in input || input instanceof Request || input[Symbol.toStringTag] === 'Request';
  }
};

const dangerouslyGetBodyFromRequest = (
  input: FetchRequestLike | FetchRequestInit | undefined
): BodyInit | null => {
  if (input != null && input instanceof Request && '_bodyInit' in input) {
    // NOTE(@kitten): whatwg-fetch has a hidden property for the body input
    // TODO(@kitten): We should have our own Request class implementation
    return (input as any)._noBody !== true ? (input as any)._bodyInit : null;
  } else {
    return input?.body ?? null;
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
    dangerouslyGetBodyFromRequest(init) ??
    (initFromRequest ? dangerouslyGetBodyFromRequest(input) : null);
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
    throw signal.reason ?? new FetchError('The operation was aborted.');
  }
  abortSubscription = addAbortSignalListener(signal, () => {
    // Propagate the abort into the JS body stream (reject the in-flight read
    // with the signal's AbortError and close the teardown guard) BEFORE
    // canceling the native request, so a late native `didReceiveResponseData`
    // can't reach an abandoned controller.
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
