import { ExpoFetchModule } from './ExpoFetchModule';
import { FetchError } from './FetchErrors';
import { FetchResponse, type AbortSubscriptionCleanupFunction } from './FetchResponse';
import { NativeRequest, NativeRequestInit } from './NativeRequest';
import { normalizeBodyInitAsync, normalizeHeadersInit, overrideHeaders } from './RequestUtils';
import type { FetchRequestInit } from './fetch.types';

export async function fetch(url: string, init?: FetchRequestInit): Promise<FetchResponse> {
  let abortSubscription: AbortSubscriptionCleanupFunction | null = null;

  const response = new FetchResponse(() => {
    abortSubscription?.();
  });
  const request = new ExpoFetchModule.NativeRequest(response) as NativeRequest;

  let headers = normalizeHeadersInit(init?.headers);

  const { body: requestBody, overriddenHeaders } = await normalizeBodyInitAsync(init?.body);
  if (overriddenHeaders) {
    headers = overrideHeaders(headers, overriddenHeaders);
  }

  const nativeRequestInit: NativeRequestInit = {
    credentials: init?.credentials ?? 'include',
    headers,
    method: init?.method ?? 'GET',
  };

  if (init?.signal && init.signal.aborted) {
    throw new FetchError('The operation was aborted.');
  }
  abortSubscription = addAbortSignalListener(init?.signal, () => {
    request.cancel();
  });
  try {
    await request.start(url, nativeRequestInit, requestBody);
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
