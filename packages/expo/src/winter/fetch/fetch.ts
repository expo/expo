import { ExpoFetchModule } from './ExpoFetchModule';
import { FetchError } from './FetchErrors';
import { FetchResponse, type AbortSubscriptionCleanupFunction } from './FetchResponse';
import { NativeRequest, NativeRequestInit } from './NativeRequest';
import { normalizeBodyInitAsync, normalizeHeadersInit, overrideHeaders } from './RequestUtils';
import type { FetchRequestInit, FetchRequestLike } from './fetch.types';

/** Returns if `input` is a Request object */
const isRequest = (input: any): input is Request =>
  input != null && typeof input === 'object' && 'body' in input;

// TODO(@kitten): Do we really want to use our own types for web standards?
export async function fetch(
  input: string | URL | FetchRequestLike,
  init?: FetchRequestInit
): Promise<FetchResponse> {
  const initFromRequest = isRequest(input);
  const url = initFromRequest ? input.url : input;
  const body = initFromRequest ? input.body : init?.body || null;
  const signal = initFromRequest ? input.signal : init?.signal || undefined;
  const redirect = initFromRequest ? input.redirect : init?.redirect;
  const method = initFromRequest ? input.method : init?.method;
  const credentials = initFromRequest ? input.credentials : init?.credentials;

  let headers = normalizeHeadersInit(initFromRequest ? input.headers : init?.headers);

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
    method: method?.toUpperCase() ?? 'GET',
    redirect: redirect ?? 'follow',
  };

  if (signal && signal.aborted) {
    throw new FetchError('The operation was aborted.');
  }
  abortSubscription = addAbortSignalListener(signal, () => {
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
