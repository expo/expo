import { HTTP_TOKEN, isBlob, normalizeBodyInitAsync, normalizeMethod } from './RequestUtils';
import { convertFormDataAsync, createBoundary } from './convertFormData';
import { createReactNativeBlobAsync, isReactNativeBlobGlobal } from './createBlob';
import type { FetchRequestInit } from './fetch.types';

// React Native's FormData is not fully compatible with the web standard, so the global FormData
// type carries extra members (e.g. `getParts`). Mirror `FetchResponse` and return the intersection.
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;

// Methods that may not carry a request body per the Fetch standard.
const BODYLESS_METHODS = new Set(['GET', 'HEAD']);
// Methods the Fetch standard forbids, compared case-insensitively.
const FORBIDDEN_METHODS = new Set(['CONNECT', 'TRACE', 'TRACK']);

function validateMethod(method: string): string {
  // A request method must be an HTTP token.
  if (!HTTP_TOKEN.test(method)) {
    throw new TypeError(
      `Failed to construct 'Request': '${method}' is not a valid HTTP method. Use a method name such as 'GET' or 'POST'.`
    );
  }
  if (FORBIDDEN_METHODS.has(method.toUpperCase())) {
    throw new TypeError(
      `Failed to construct 'Request': '${method}' HTTP method is unsupported. The Fetch standard forbids CONNECT, TRACE and TRACK.`
    );
  }
  return normalizeMethod(method);
}

// Parses the URL like the spec does, but keeps input that can't be parsed as-is instead of throwing,
// for compatibility with React Native's `whatwg-fetch` Request.
function serializeURL(input: string | URL): string {
  const urlString = `${input}`;
  try {
    return new URL(urlString).href;
  } catch {
    return urlString;
  }
}

function copyFormData(source: FormData): FormData {
  const copy = new FormData();
  source.forEach((value, name) => {
    copy.append(name, value);
  });
  return copy;
}

// The spec extracts the body at construction, so later changes to a mutable body input don't
// affect the request. Copy the mutable inputs to match that.
function copyBodyInit(body: BodyInit): BodyInit {
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (body instanceof ArrayBuffer) {
    return body.slice(0);
  }
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength).slice();
  }
  if (body instanceof FormData) {
    return copyFormData(body);
  }
  return body;
}

// The shape of React Native's `whatwg-fetch` Request. It has no `Symbol.toStringTag` and keeps the
// body input on hidden fields instead of exposing a `body` stream.
type WhatwgFetchRequest = {
  url: string;
  bodyUsed: boolean;
  _bodyInit?: BodyInit | null;
  _noBody?: boolean;
};

function isWhatwgFetchRequest(input: object): input is WhatwgFetchRequest {
  return '_bodyInit' in input && typeof (input as { url?: unknown }).url === 'string';
}

function isRequest(input: unknown): input is Request {
  return (
    input != null &&
    typeof input === 'object' &&
    (input instanceof Request ||
      (input as { [Symbol.toStringTag]?: string })[Symbol.toStringTag] === 'Request' ||
      isWhatwgFetchRequest(input))
  );
}

// Internal state for `Request` instances, kept out of the class so internal fields don't leak onto
// the public `Request` type, own properties, or cross-realm `whatwg-fetch` detection.
type RequestInternalState = {
  url: string;
  method: string;
  headers: Headers;
  credentials: RequestCredentials;
  redirect: RequestRedirect;
  signal: AbortSignal;
  mode: RequestMode;
  cache: RequestCache;
  referrer: string;
  referrerPolicy: ReferrerPolicy;
  integrity: string;
  keepalive: boolean;
  // The raw body input, kept so `fetch()` can normalize it without consuming the request.
  // Replaced by a tee branch when a stream body is cloned.
  bodyInit: BodyInit | null;
  // Whether the body has been read/disturbed.
  consumed: boolean;
  // The lazily-created body stream. Cached so `.body` returns the same object across gets.
  bodyStream: ReadableStream<Uint8Array<ArrayBuffer>> | null;
  // The multipart boundary of a request's FormData body. Set at construction, like the spec's body
  // extraction, so the Content-Type header matches the body that `text()` and `fetch()` produce.
  formDataBoundary?: string;
};

const requestStates = new WeakMap<Request, RequestInternalState>();

function getState(request: Request): RequestInternalState {
  const state = requestStates.get(request);
  if (state == null) {
    throw new TypeError('Illegal invocation');
  }
  return state;
}

export function getRequestFormDataBoundary(request: object): string | undefined {
  return requestStates.get(request as Request)?.formDataBoundary;
}

/**
 * Validates and marks a `ReadableStream` body as consumed when `fetch()` reads it directly.
 * Throws a `TypeError` if the stream or its owning `Request` is already locked or disturbed, and
 * sets `consumed` so `bodyUsed` stays accurate even without a `_disturbed` flag.
 */
export function consumeRequestStreamBody(
  request: object | null | undefined,
  stream: ReadableStream
): void {
  const state = request != null ? requestStates.get(request as Request) : undefined;
  if (
    isStreamUnusable(stream) ||
    (state != null
      ? isStateBodyUnusable(state)
      : (request as { bodyUsed?: boolean } | null | undefined)?.bodyUsed === true)
  ) {
    throw new TypeError(
      state != null || isRequest(request)
        ? "Failed to execute 'fetch': the request body is already used. Create a new request with a fresh body, or clone the request before reading its body."
        : "Failed to execute 'fetch': the body stream is locked or was already read. Pass a fresh ReadableStream."
    );
  }
  if (state != null) {
    state.consumed = true;
  }
}

// Reads the boundary of a `multipart/form-data` content type.
function parseMultipartBoundary(contentType: string): string | null {
  const match = /^multipart\/form-data\s*;.*\bboundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

/**
 * Returns the body input of a request from any `Request` implementation, without reading it.
 * Our own `Request` and `whatwg-fetch` keep the raw body input, other implementations expose
 * only the `body` stream.
 */
export function getRequestBodyInit(request: object): BodyInit | null {
  const state = requestStates.get(request as Request);
  if (state != null) {
    return state.bodyInit;
  }
  if (isWhatwgFetchRequest(request)) {
    return request._noBody !== true ? (request._bodyInit ?? null) : null;
  }
  return (request as { body?: BodyInit | null }).body ?? null;
}

const REQUEST_MODES = ['same-origin', 'no-cors', 'cors', 'navigate'];
const REQUEST_CREDENTIALS = ['omit', 'same-origin', 'include'];
const REQUEST_CACHES = [
  'default',
  'no-store',
  'reload',
  'no-cache',
  'force-cache',
  'only-if-cached',
];
const REQUEST_REDIRECTS = ['follow', 'error', 'manual'];
const REQUEST_PRIORITIES = ['high', 'low', 'auto'];
const REFERRER_POLICIES = [
  '',
  'no-referrer',
  'no-referrer-when-downgrade',
  'same-origin',
  'origin',
  'strict-origin',
  'origin-when-cross-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
];
// Methods allowed with the `no-cors` mode.
const CORS_SAFELISTED_METHODS = new Set(['GET', 'HEAD', 'POST']);

// Throws like WebIDL does for a value that isn't in an enum.
function validateEnum<T extends string>(
  value: T | undefined,
  values: string[],
  name: string
): T | undefined {
  if (value !== undefined && !values.includes(value)) {
    throw new TypeError(
      `Failed to construct 'Request': '${value}' is not a valid value for '${name}'. Use one of ${values.map((v) => `'${v}'`).join(', ')}.`
    );
  }
  return value;
}

function parseReferrer(referrer: string): string {
  if (referrer === '') {
    return '';
  }
  let parsed: string;
  try {
    parsed = new URL(referrer).href;
  } catch {
    throw new TypeError(
      `Failed to construct 'Request': the referrer '${referrer}' is not a valid URL. Use an absolute URL, 'about:client', or an empty string.`
    );
  }
  return parsed;
}

// `_disturbed` is set by `web-streams-polyfill` (React Native's `ReadableStream`).
function isStreamDisturbed(stream: ReadableStream): boolean {
  return (stream as { _disturbed?: boolean })._disturbed === true;
}

// Whether a stream is locked or already disturbed.
function isStreamUnusable(stream: ReadableStream): boolean {
  return stream.locked || isStreamDisturbed(stream);
}

// Locks `source` and returns a distinct stream that forwards its chunks, matching the Fetch
// spec's proxy stream when constructing a `Request` from another `Request` with a stream body.
function createProxyReadableStream(
  source: ReadableStream
): ReadableStream<Uint8Array<ArrayBuffer>> {
  const reader = source.getReader();
  let canceled = false;
  return new ReadableStream<Uint8Array<ArrayBuffer>>(
    {
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (canceled) {
            return;
          }
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        } catch (error) {
          if (!canceled) {
            controller.error(error);
          }
        }
      },
      cancel(reason) {
        canceled = true;
        return reader.cancel(reason);
      },
    },
    { highWaterMark: 0 }
  );
}

function isStateBodyUsed(state: RequestInternalState): boolean {
  if (state.consumed) {
    return true;
  }
  return state.bodyInit instanceof ReadableStream && isStreamDisturbed(state.bodyInit);
}

function isStateBodyUnusable(state: RequestInternalState): boolean {
  if (isStateBodyUsed(state)) {
    return true;
  }
  if (state.bodyInit instanceof ReadableStream) {
    return state.bodyInit.locked;
  }
  return state.bodyStream?.locked === true;
}

function isRequestBodyUnusable(request: object, body: BodyInit | null): boolean {
  const state = requestStates.get(request as Request);
  if (state != null) {
    return isStateBodyUnusable(state);
  }
  if ((request as { bodyUsed?: boolean }).bodyUsed) {
    return true;
  }
  return body instanceof ReadableStream && isStreamUnusable(body);
}

function markStateConsumed(
  state: RequestInternalState,
  method: string,
  { lockStream = true }: { lockStream?: boolean } = {}
): void {
  if (isStateBodyUnusable(state)) {
    throw new TypeError(
      `Failed to execute '${method}' on 'Request': Request body is already used.`
    );
  }
  state.consumed = true;
  // Lock the body stream so it can't be read again. `consumeStateAsBytes()` passes
  // `lockStream: false` because it immediately acquires a reader on a stream body itself.
  if (state.bodyInit instanceof ReadableStream) {
    if (lockStream) {
      state.bodyInit.getReader();
    }
  } else if (state.bodyStream != null) {
    state.bodyStream.getReader();
  }
}

async function consumeStateAsBytes(
  state: RequestInternalState,
  method: string
): Promise<Uint8Array<ArrayBuffer>> {
  const body = state.bodyInit;
  // A null body can't be disturbed, so reading it doesn't mark the request as used.
  if (body == null) {
    return new Uint8Array(0);
  }
  markStateConsumed(state, method, { lockStream: false });
  if (body instanceof FormData) {
    const { body: bytes } = await convertFormDataAsync(body, state.formDataBoundary);
    return bytes as Uint8Array<ArrayBuffer>;
  }
  const { body: bytes } = await normalizeBodyInitAsync(body);
  return (bytes as Uint8Array<ArrayBuffer> | null) ?? new Uint8Array(0);
}

async function consumeStateAsText(state: RequestInternalState, method: string): Promise<string> {
  const bytes = await consumeStateAsBytes(state, method);
  return new TextDecoder().decode(bytes);
}

// Also accepts a Blob-like object, e.g. a file from `expo-file-system`, which isn't an instance of
// `Blob`. `size` tells it apart from a `Response`, which also has `arrayBuffer()` and `type`.
function isBlobLike(body: object): body is Blob {
  return body instanceof Blob || (isBlob(body) && 'size' in body);
}

function setDefaultContentType(headers: Headers, body: BodyInit | null): void {
  if (body == null || headers.has('content-type')) {
    return;
  }
  if (typeof body === 'string') {
    headers.set('content-type', 'text/plain;charset=UTF-8');
  } else if (isBlobLike(body) && body.type) {
    headers.set('content-type', body.type);
  } else if (body instanceof URLSearchParams) {
    headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  }
}

const REQUEST_INIT_MEMBERS: (keyof FetchRequestInit)[] = [
  'method',
  'headers',
  'body',
  'referrer',
  'referrerPolicy',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'integrity',
  'keepalive',
  'signal',
  'duplex',
  'priority',
  'window',
];

// Like a WebIDL dictionary, an init is empty when none of its members is set to a value other than
// `undefined`.
function isEmptyInit(init: FetchRequestInit | null | undefined): boolean {
  return init == null || REQUEST_INIT_MEMBERS.every((member) => init[member] === undefined);
}

function isBodyInit(body: object): boolean {
  return (
    isBlobLike(body) ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof ReadableStream
  );
}

type RequestInput = string | URL | Request | globalThis.Request;

/**
 * A `Request` implementation for `expo/fetch` that follows the Fetch standard, with a few
 * deviations kept for compatibility with `whatwg-fetch`: invalid URLs don't throw, stream bodies
 * don't require `duplex`, forbidden or `no-cors` request headers aren't filtered, and `signal` is
 * the given signal instead of a new one that follows it.
 *
 * React Native installs the `whatwg-fetch` polyfill as the global `Request`, which is not fully
 * spec-compliant and forces `expo/fetch` to reach into its private fields to recover the body.
 * This class lets `expo/fetch` own its `Request` so the body, headers, and metadata round-trip
 * predictably. It is installed as the global `Request` on native.
 */
export class Request implements Body {
  // A default for `init` keeps `Request.length` at 1, like WebIDL's optional arguments.
  constructor(input: RequestInput, init: FetchRequestInit = {}) {
    if (arguments.length < 1) {
      throw new TypeError(
        "Failed to construct 'Request': 1 argument required, but only 0 present."
      );
    }

    let headers: HeadersInit | undefined = init?.headers;
    let method: string | undefined = init?.method;
    let credentials = validateEnum(init?.credentials, REQUEST_CREDENTIALS, 'credentials');
    let redirect = validateEnum(init?.redirect, REQUEST_REDIRECTS, 'redirect');
    let signal: AbortSignal | null | undefined = init?.signal;
    let mode = validateEnum(init?.mode, REQUEST_MODES, 'mode');
    let cache = validateEnum(init?.cache, REQUEST_CACHES, 'cache');
    let referrer = init?.referrer;
    let referrerPolicy = validateEnum(init?.referrerPolicy, REFERRER_POLICIES, 'referrerPolicy');
    let integrity = init?.integrity;
    validateEnum(init?.priority, REQUEST_PRIORITIES, 'priority');
    let keepalive = init?.keepalive;
    let url: string;
    let inputBody: BodyInit | null = null;

    if (init?.window != null) {
      throw new TypeError("Failed to construct 'Request': 'window' can only be null.");
    }
    // `fetch()` listens for `abort` with `addEventListener()`.
    if (
      signal != null &&
      (typeof signal !== 'object' ||
        !('aborted' in signal) ||
        typeof signal.addEventListener !== 'function')
    ) {
      throw new TypeError(
        "Failed to construct 'Request': 'signal' must be an AbortSignal or null."
      );
    }
    if (init?.duplex !== undefined && (init.duplex as string) !== 'half') {
      throw new TypeError(
        `Failed to construct 'Request': '${init.duplex}' is not a valid value for 'duplex'. Use 'half'.`
      );
    }

    if (isRequest(input)) {
      url = input.url;
      method ??= input.method;
      credentials ??= input.credentials;
      redirect ??= input.redirect;
      // A `null` signal in the init replaces the input's signal.
      if (signal === undefined) {
        signal = input.signal;
      }
      // `whatwg-fetch` leaves some of these unset or `null`, so they fall back to the defaults.
      mode ??= input.mode ?? undefined;
      cache ??= input.cache ?? undefined;
      // Per the spec, a non-empty init resets the referrer and referrer policy of the input.
      if (isEmptyInit(init)) {
        referrer = input.referrer ?? undefined;
        referrerPolicy = input.referrerPolicy ?? undefined;
      }
      integrity ??= input.integrity ?? undefined;
      keepalive ??= input.keepalive ?? undefined;
      if (headers == null) {
        headers = input.headers;
      }
      inputBody = getRequestBodyInit(input);
    } else {
      url = serializeURL(input as string | URL);
    }

    if (mode === 'navigate') {
      throw new TypeError(
        "Failed to construct 'Request': cannot construct a Request with mode 'navigate'."
      );
    }
    if (cache === 'only-if-cached' && mode !== 'same-origin') {
      throw new TypeError(
        "Failed to construct 'Request': the 'only-if-cached' cache mode can be used only with the 'same-origin' mode."
      );
    }
    const normalizedMethod = method != null ? validateMethod(method) : 'GET';
    if (mode === 'no-cors' && !CORS_SAFELISTED_METHODS.has(normalizedMethod)) {
      throw new TypeError(
        `Failed to construct 'Request': '${normalizedMethod}' is unsupported in 'no-cors' mode. Use GET, HEAD or POST, or another mode.`
      );
    }

    let initBody: BodyInit | null = init?.body ?? null;
    if (
      initBody != null &&
      typeof initBody !== 'string' &&
      !(typeof initBody === 'object' && isBodyInit(initBody))
    ) {
      // WebIDL converts other values to a string, e.g. a number, or an object through its
      // `toString()`. A template literal also throws for a Symbol, like WebIDL does.
      initBody = `${initBody}`;
    }
    if ((initBody != null || inputBody != null) && BODYLESS_METHODS.has(normalizedMethod)) {
      throw new TypeError(
        `Failed to construct 'Request': a ${normalizedMethod} request can't have a body. Remove the body, or use another method such as POST.`
      );
    }
    if (initBody instanceof ReadableStream) {
      // Per the spec's body extraction, keepalive requests can't have a stream body.
      if (keepalive) {
        throw new TypeError(
          "Failed to construct 'Request': a keepalive request can't have a ReadableStream body. Use another body type, or set 'keepalive' to false."
        );
      }
      if (isStreamUnusable(initBody)) {
        throw new TypeError(
          "Failed to construct 'Request': the body stream is locked or was already read. Pass a fresh ReadableStream."
        );
      }
    }
    // Per the spec, this check also applies to a stream body from the input request, so that
    // `clone()` accepts every request that the constructor accepts.
    if (
      (initBody ?? inputBody) instanceof ReadableStream &&
      mode != null &&
      mode !== 'cors' &&
      mode !== 'same-origin'
    ) {
      throw new TypeError(
        "Failed to construct 'Request': a ReadableStream body can be used only with the 'cors' or 'same-origin' mode."
      );
    }
    const reuseInputBody = initBody == null && inputBody != null;
    if (reuseInputBody && isRequestBodyUnusable(input as object, inputBody)) {
      throw new TypeError(
        "Failed to construct 'Request': the source request body is already used. Create a new request with a fresh body, or clone the source request before reading its body."
      );
    }

    const requestHeaders = new Headers(headers);
    const parsedReferrer = referrer != null ? parseReferrer(referrer) : 'about:client';

    let bodyInit: BodyInit | null = initBody ?? inputBody;
    // Per the spec, only a body from `init` sets a default Content-Type. A body from the input
    // request keeps the input's headers, unless `init.headers` replaced them.
    if (initBody != null) {
      setDefaultContentType(requestHeaders, bodyInit);
    }
    if (bodyInit != null) {
      bodyInit = copyBodyInit(bodyInit);
    }

    let formDataBoundary: string | undefined;
    if (bodyInit instanceof FormData) {
      const contentType = requestHeaders.get('content-type');
      if (initBody != null) {
        if (contentType == null) {
          formDataBoundary = createBoundary();
          requestHeaders.set('content-type', `multipart/form-data; boundary=${formDataBoundary}`);
        } else {
          // Keep the boundary of an explicit multipart content type, so the body matches the header.
          formDataBoundary = parseMultipartBoundary(contentType) ?? undefined;
        }
      } else {
        // Preserve the source request's FormData boundary without adding a default Content-Type
        // when `init.headers` replaced the source headers.
        formDataBoundary =
          getRequestFormDataBoundary(input as object) ??
          (contentType != null ? (parseMultipartBoundary(contentType) ?? undefined) : undefined);
      }
    }

    // Consume the source body last, so a constructor that throws leaves the source usable.
    if (reuseInputBody) {
      const source = input as object;
      if (bodyInit instanceof ReadableStream) {
        // Lock the source stream and forward its chunks through a distinct stream, per the Fetch spec.
        bodyInit = createProxyReadableStream(bodyInit);
      }
      const sourceState = requestStates.get(source as Request);
      if (sourceState != null) {
        sourceState.consumed = true;
        if (sourceState.bodyStream != null && sourceState.bodyStream !== sourceState.bodyInit) {
          sourceState.bodyStream.getReader();
        }
      } else if (isWhatwgFetchRequest(source)) {
        source.bodyUsed = true;
      }
      // Other implementations only expose a `body` stream, which `createProxyReadableStream` locked above.
    }

    requestStates.set(this, {
      url,
      method: normalizedMethod,
      headers: requestHeaders,
      credentials: credentials ?? 'same-origin',
      redirect: redirect ?? 'follow',
      // Kept as-is, like in `whatwg-fetch`. The spec's own signal that follows the given one needs an
      // `abort` listener on the given signal, and nothing could remove that listener.
      signal: signal ?? new AbortController().signal,
      mode: mode ?? 'cors',
      cache: cache ?? 'default',
      referrer: parsedReferrer,
      referrerPolicy: referrerPolicy ?? '',
      integrity: integrity ?? '',
      // WebIDL converts the value to a boolean.
      keepalive: Boolean(keepalive),
      bodyInit,
      consumed: false,
      bodyStream: null,
      formDataBoundary,
    });
  }

  get url(): string {
    return getState(this).url;
  }
  get method(): string {
    return getState(this).method;
  }
  get headers(): Headers {
    return getState(this).headers;
  }
  get credentials(): RequestCredentials {
    return getState(this).credentials;
  }
  get redirect(): RequestRedirect {
    return getState(this).redirect;
  }
  get signal(): AbortSignal {
    return getState(this).signal;
  }
  // The attributes below are exposed for spec compatibility, but `expo/fetch` doesn't act on them.
  get mode(): RequestMode {
    return getState(this).mode;
  }
  get cache(): RequestCache {
    return getState(this).cache;
  }
  get referrer(): string {
    return getState(this).referrer;
  }
  get referrerPolicy(): ReferrerPolicy {
    return getState(this).referrerPolicy;
  }
  get integrity(): string {
    return getState(this).integrity;
  }
  get keepalive(): boolean {
    return getState(this).keepalive;
  }
  get destination(): RequestDestination {
    return '';
  }
  get duplex(): 'half' {
    return 'half';
  }
  get isReloadNavigation(): boolean {
    return false;
  }
  get isHistoryNavigation(): boolean {
    return false;
  }

  get bodyUsed(): boolean {
    return isStateBodyUsed(getState(this));
  }

  get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
    const state = getState(this);
    if (state.bodyInit == null) {
      return null;
    }
    if (state.bodyStream != null) {
      return state.bodyStream;
    }
    if (state.bodyInit instanceof ReadableStream) {
      state.bodyStream = state.bodyInit;
      return state.bodyStream;
    }
    const bodyInit = state.bodyInit;
    let canceled = false;
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>(
      {
        pull: async (controller) => {
          // The first pull disturbs the body. Done here rather than in `start` so that merely
          // getting `.body` (which constructs the stream) doesn't flip `bodyUsed`.
          state.consumed = true;
          try {
            // Serialize a FormData body with the boundary that the Content-Type header names.
            const { body } = await normalizeBodyInitAsync(bodyInit, {
              formDataBoundary: state.formDataBoundary,
            });
            if (canceled) {
              return;
            }
            if (body != null && body.byteLength > 0) {
              controller.enqueue(new Uint8Array(body));
            }
            controller.close();
          } catch (error) {
            if (!canceled) {
              controller.error(error);
            }
          }
        },
        cancel: () => {
          canceled = true;
          state.consumed = true;
        },
      },
      {
        // Keep pull lazy. The default highWaterMark of 1 fires pull at construction and would flip
        // `consumed` before anything had actually been read.
        highWaterMark: 0,
      }
    );
    // If the body was already consumed before `.body` was accessed, lock the stream so it cannot
    // be read again.
    if (state.consumed) {
      stream.getReader();
    }
    state.bodyStream = stream;
    return state.bodyStream;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const bytes = await consumeStateAsBytes(getState(this), 'arrayBuffer');
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    // A byte body comes back as a view of the stored body, which `fetch()` can still send.
    return (await consumeStateAsBytes(getState(this), 'bytes')).slice();
  }

  async blob(): Promise<Blob> {
    const state = getState(this);
    const body = state.bodyInit;
    // Per the spec, the blob type comes from the `Content-Type` header.
    const type = state.headers.get('content-type') ?? '';
    if (body instanceof Blob && body.type === type) {
      markStateConsumed(state, 'blob');
      return body;
    }
    const bytes = await consumeStateAsBytes(state, 'blob');
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    // React Native's Blob can't be created from bytes in JS, like in `FetchResponse.blob()`.
    if (isReactNativeBlobGlobal()) {
      return createReactNativeBlobAsync(buffer, type);
    }
    return new Blob([buffer], { type });
  }

  async text(): Promise<string> {
    return consumeStateAsText(getState(this), 'text');
  }

  async json(): Promise<any> {
    return JSON.parse(await consumeStateAsText(getState(this), 'json'));
  }

  async formData(): Promise<UniversalFormData> {
    const state = getState(this);
    const body = state.bodyInit;
    if (body instanceof FormData) {
      markStateConsumed(state, 'formData');
      return copyFormData(body) as UniversalFormData;
    }
    const contentType = state.headers.get('content-type') ?? '';
    const mimeType = contentType.split(';', 1)[0]!.trim().toLowerCase();
    if (mimeType !== 'application/x-www-form-urlencoded') {
      if (body != null) {
        markStateConsumed(state, 'formData');
      }
      throw new TypeError(
        `Failed to execute 'formData' on 'Request': the body can't be parsed as form data because its Content-Type is '${contentType}'. Use a FormData or URLSearchParams body, or set the Content-Type to 'application/x-www-form-urlencoded'.`
      );
    }
    // Mirrors the URL-encoded parsing in `FetchResponse.formData()`.
    const text = await consumeStateAsText(state, 'formData');
    const searchParams = new URLSearchParams(text);
    const formData = new FormData() as UniversalFormData;
    searchParams.forEach((value, key) => {
      formData.append(key, value);
    });
    return formData;
  }

  clone(): Request {
    const state = getState(this);
    if (isStateBodyUnusable(state)) {
      throw new TypeError("Failed to execute 'clone' on 'Request': Request body is already used.");
    }
    let cloneBody = state.bodyInit;
    if (cloneBody instanceof ReadableStream) {
      // A stream can be read only once, so tee it: this request keeps one branch and the clone
      // gets the other, per the Fetch spec.
      const [ownBranch, cloneBranch] = cloneBody.tee();
      state.bodyInit = ownBranch;
      state.bodyStream = null;
      cloneBody = cloneBranch;
    } else if (cloneBody != null) {
      cloneBody = copyBodyInit(cloneBody);
    }
    const cloned = Object.create(Request.prototype) as Request;
    requestStates.set(cloned, {
      ...state,
      headers: new Headers(state.headers),
      bodyInit: cloneBody,
      consumed: false,
      bodyStream: null,
    });
    return cloned;
  }
}

// Brand instances as `Request` so `Object.prototype.toString.call(request)` returns
// `[object Request]` per the Fetch spec, and so `fetch()` can recognize a request via its
// `Symbol.toStringTag` even when `instanceof` fails (e.g. an instance from another realm or
// React Native's whatwg-fetch). Defined on the prototype as a non-enumerable property, matching
// `FetchResponse`.
Object.defineProperty(Request.prototype, Symbol.toStringTag, {
  value: 'Request',
  configurable: true,
});

// WebIDL exposes attributes and operations as enumerable prototype properties, unlike class syntax.
// Only the public interface members, not the private helpers.
for (const name of [
  'url',
  'method',
  'headers',
  'credentials',
  'redirect',
  'signal',
  'mode',
  'cache',
  'referrer',
  'referrerPolicy',
  'integrity',
  'keepalive',
  'destination',
  'duplex',
  'isReloadNavigation',
  'isHistoryNavigation',
  'bodyUsed',
  'body',
  'arrayBuffer',
  'bytes',
  'blob',
  'text',
  'json',
  'formData',
  'clone',
]) {
  const descriptor = Object.getOwnPropertyDescriptor(Request.prototype, name)!;
  Object.defineProperty(Request.prototype, name, { ...descriptor, enumerable: true });
}
