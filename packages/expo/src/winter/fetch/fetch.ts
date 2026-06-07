import { ExpoFetchModule } from './ExpoFetchModule';
import { FetchError } from './FetchErrors';
import { FetchResponse, type AbortSubscriptionCleanupFunction } from './FetchResponse';
import type { NativeRequest, NativeRequestInit } from './NativeRequest';
import { Request as ExpoRequest } from './Request';
import {
  normalizeBodyInitAsync,
  normalizeHeadersInit,
  overrideHeaders,
  normalizeMethod,
} from './RequestUtils';
import type { FetchRequestInit, FetchRequestLike } from './fetch.types';

// Installed by React Native in development when network inspection is enabled. Typed here, not in
// `global.d.ts`, because other packages typecheck this file without that declaration.
type NetworkReporterGlobal = {
  __NETWORK_REPORTER__?: { createDevToolsRequestId(): string };
};

/** Returns if `input` is a Request object */
const isRequest = (input: any): input is FetchRequestLike => {
  if (input == null || typeof input !== 'object') {
    return false;
  } else {
    return 'body' in input || input instanceof Request || input[Symbol.toStringTag] === 'Request';
  }
};

const getBodyFromRequest = (
  input: FetchRequestLike | FetchRequestInit | undefined
): BodyInit | null => {
  if (input instanceof ExpoRequest) {
    return input._bodyInit;
  }
  if (input != null && input instanceof Request /* global */ && '_bodyInit' in input) {
    // NOTE(@kitten): whatwg-fetch (React Native's global Request) keeps the body input on a hidden
    // property. Honor it when a foreign Request reaches `fetch()`, but our own Request is handled
    // above.
    return (input as any)._noBody !== true ? (input as any)._bodyInit : null;
  }
  return input?.body ?? null;
};

// TODO(@kitten): Do we really want to use our own types for web standards?
export async function fetch(
  input: string | URL | FetchRequestLike,
  init?: FetchRequestInit
): Promise<FetchResponse> {
  // Created before any `await`, so React Native DevTools captures this call stack as the initiator
  const devToolsRequestId = (
    globalThis as NetworkReporterGlobal
  ).__NETWORK_REPORTER__?.createDevToolsRequestId();
  const initFromRequest = isRequest(input);
  const url = initFromRequest ? input.url : input;
  const body = getBodyFromRequest(init) ?? (initFromRequest ? getBodyFromRequest(input) : null);
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

  const {
    body: requestBody,
    defaultHeaders,
    overriddenHeaders,
  } = await normalizeBodyInitAsync(body);
  if (defaultHeaders) {
    headers = overrideHeaders(defaultHeaders, headers);
  } else if (overriddenHeaders) {
    headers = overrideHeaders(headers, overriddenHeaders);
  }

  const nativeRequestInit: NativeRequestInit = {
    credentials: credentials ?? 'include',
    headers,
    method: method != null ? normalizeMethod(method) : 'GET',
    redirect: redirect ?? 'follow',
    devToolsRequestId,
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
