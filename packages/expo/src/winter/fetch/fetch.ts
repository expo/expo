import { ExpoFetchModule } from './ExpoFetchModule';
import { FetchError } from './FetchErrors';
import { FetchResponse } from './FetchResponse';
import { NativeRequest, NativeRequestInit } from './NativeRequest';
import { normalizeBodyInitAsync, normalizeHeadersInit, overrideHeaders } from './RequestUtils';
import type { FetchRequestInit } from './fetch.types';

export async function fetch(url: string, init?: FetchRequestInit): Promise<FetchResponse> {
  const response = new FetchResponse();
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
  const abortHandler = () => {
    request.cancel();
  };
  init?.signal?.addEventListener('abort', abortHandler);
  try {
    await request.start(url, nativeRequestInit, requestBody);
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw FetchError.createFromError(e);
    } else {
      throw new FetchError(String(e));
    }
  } finally {
    init?.signal?.removeEventListener('abort', abortHandler);
  }
  return response;
}
