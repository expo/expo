import { normalizeBodyInitAsync, normalizeMethod } from './RequestUtils';
import { convertFormDataAsync } from './convertFormData';
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
// An HTTP token, which a request method must be.
const METHOD_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function validateMethod(method: string): string {
  if (!METHOD_TOKEN.test(method)) {
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
  try {
    return new URL(`${input}`).href;
  } catch {
    return `${input}`;
  }
}

// Returns a new signal that aborts with the given signal. Not `AbortSignal.any()`, which not every
// runtime this code runs in provides.
function followSignal(signal: AbortSignal): AbortSignal {
  const controller = new AbortController();
  if (signal.aborted) {
    controller.abort(signal.reason);
  } else {
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
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

/**
 * Returns the body input of a request from any `Request` implementation, without reading it.
 * Our own `Request` and `whatwg-fetch` keep the raw body input, other implementations expose
 * only the `body` stream.
 */
export function getRequestBodyInit(request: object): BodyInit | null {
  if (request instanceof Request) {
    return request._bodyInit;
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

// Whether a stream was already read from. `locked` is standard; `_disturbed` is set by the
// `web-streams-polyfill` that provides `ReadableStream` in React Native.
function isStreamUnusable(stream: ReadableStream): boolean {
  return stream.locked || (stream as { _disturbed?: boolean })._disturbed === true;
}

function isBodyInit(body: object): boolean {
  return (
    body instanceof Blob ||
    // Blob-like objects, e.g. files from `expo-file-system`.
    ('arrayBuffer' in body && 'type' in body) ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof ReadableStream
  );
}

type RequestState = {
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
};

/**
 * A `Request` implementation for `expo/fetch` that follows the Fetch standard, with a few
 * deviations kept for compatibility with `whatwg-fetch`: invalid URLs don't throw, stream bodies
 * don't require `duplex`, a FormData body gets its Content-Type in `fetch()`, and forbidden or
 * `no-cors` request headers aren't filtered.
 *
 * React Native installs the `whatwg-fetch` polyfill as the global `Request`, which is not fully
 * spec-compliant and forces `expo/fetch` to reach into its private fields to recover the body.
 * This class lets `expo/fetch` own its `Request` so the body, headers, and metadata round-trip
 * predictably. It is installed as the global `Request` on native.
 */
export class Request implements Body {
  // Backs the attribute getters, which are read-only like WebIDL attributes.
  private readonly state: RequestState;

  // The raw body input, kept so `fetch()` can normalize it without consuming the request.
  // Replaced by a tee branch when a stream body is cloned.
  _bodyInit: BodyInit | null;

  // Whether the body has been read/disturbed. The `bodyUsed` getter also factors in a locked
  // body stream.
  private consumed = false;
  // The lazily-created body stream. Cached so `.body` returns the same object across gets, and
  // so reading or locking it disturbs this request's body (sets `consumed`) per the Fetch spec.
  private bodyStream: ReadableStream<Uint8Array<ArrayBuffer>> | null = null;

  // A default for `init` keeps `Request.length` at 1, like WebIDL's optional arguments.
  constructor(input: string | URL | Request, init: FetchRequestInit = {}) {
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
      signal ??= input.signal;
      // `whatwg-fetch` leaves some of these unset or `null`, so they fall back to the defaults.
      mode ??= input.mode ?? undefined;
      cache ??= input.cache ?? undefined;
      referrer ??= input.referrer ?? undefined;
      referrerPolicy ??= input.referrerPolicy ?? undefined;
      integrity ??= input.integrity ?? undefined;
      keepalive ??= input.keepalive ?? undefined;
      if (headers == null) {
        headers = input.headers;
      }
      inputBody = getRequestBodyInit(input);
    } else {
      url = serializeURL(input);
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
    if (initBody != null && typeof initBody === 'object' && !isBodyInit(initBody)) {
      // WebIDL converts other values to a string, e.g. through their `toString()`.
      initBody = String(initBody);
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
      if (mode != null && mode !== 'cors' && mode !== 'same-origin') {
        throw new TypeError(
          "Failed to construct 'Request': a ReadableStream body can be used only with the 'cors' or 'same-origin' mode."
        );
      }
    }
    const reuseInputBody = initBody == null && inputBody != null;
    if (reuseInputBody && (input as Request).bodyUsed) {
      throw new TypeError(
        "Failed to construct 'Request': the source request body is already used. Create a new request with a fresh body, or clone the source request before reading its body."
      );
    }

    this.state = {
      url,
      method: normalizedMethod,
      headers: new Headers(headers),
      credentials: credentials ?? 'same-origin',
      redirect: redirect ?? 'follow',
      // Per the spec, the request gets its own signal that follows the given one.
      signal: signal != null ? followSignal(signal) : new AbortController().signal,
      mode: mode ?? 'cors',
      cache: cache ?? 'default',
      referrer: referrer != null ? parseReferrer(referrer) : 'about:client',
      referrerPolicy: referrerPolicy ?? '',
      integrity: integrity ?? '',
      // WebIDL converts the value to a boolean.
      keepalive: Boolean(keepalive),
    };

    this._bodyInit = initBody ?? inputBody;
    this.setDefaultContentType();
    if (this._bodyInit != null) {
      this._bodyInit = copyBodyInit(this._bodyInit);
    }

    // Consume the source body last, so a constructor that throws leaves the source usable.
    if (reuseInputBody) {
      const source = input as object;
      if (source instanceof Request) {
        source.consumed = true;
      } else if (isWhatwgFetchRequest(source)) {
        source.bodyUsed = true;
      }
      // Other implementations only expose a `body` stream, which is disturbed once we read it.
    }
  }

  get url(): string {
    return this.state.url;
  }
  get method(): string {
    return this.state.method;
  }
  get headers(): Headers {
    return this.state.headers;
  }
  get credentials(): RequestCredentials {
    return this.state.credentials;
  }
  get redirect(): RequestRedirect {
    return this.state.redirect;
  }
  get signal(): AbortSignal {
    return this.state.signal;
  }
  // The attributes below are exposed for spec compatibility, but `expo/fetch` doesn't act on them.
  get mode(): RequestMode {
    return this.state.mode;
  }
  get cache(): RequestCache {
    return this.state.cache;
  }
  get referrer(): string {
    return this.state.referrer;
  }
  get referrerPolicy(): ReferrerPolicy {
    return this.state.referrerPolicy;
  }
  get integrity(): string {
    return this.state.integrity;
  }
  get keepalive(): boolean {
    return this.state.keepalive;
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
    // A locked stream counts as disturbed even before the first read completes.
    return this.consumed || this.bodyStream?.locked === true;
  }

  get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
    if (this._bodyInit == null) {
      return null;
    }
    if (this.bodyStream != null) {
      return this.bodyStream;
    }
    if (this._bodyInit instanceof ReadableStream) {
      this.bodyStream = this._bodyInit;
      return this.bodyStream;
    }
    const bodyInit = this._bodyInit;
    this.bodyStream = new ReadableStream<Uint8Array<ArrayBuffer>>(
      {
        pull: async (controller) => {
          // The first pull disturbs the body. Done here rather than in `start` so that merely
          // getting `.body` (which constructs the stream) doesn't flip `bodyUsed`.
          this.consumed = true;
          try {
            const { body } = await normalizeBodyInitAsync(bodyInit);
            if (body != null) {
              controller.enqueue(new Uint8Array(body));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
        cancel: () => {
          this.consumed = true;
        },
      },
      {
        // Keep pull lazy. The default highWaterMark of 1 fires pull at construction and would flip
        // `consumed` before anything had actually been read.
        highWaterMark: 0,
      }
    );
    return this.bodyStream;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const bytes = await this.consumeAsBytes('arrayBuffer');
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    return this.consumeAsBytes('bytes');
  }

  async blob(): Promise<Blob> {
    const body = this._bodyInit;
    // Per the spec, the blob type comes from the `Content-Type` header.
    const type = this.headers.get('content-type') ?? '';
    if (body instanceof Blob && body.type === type) {
      this.markConsumed('blob');
      return body;
    }
    const bytes = await this.consumeAsBytes('blob');
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    // React Native's Blob can't be created from bytes in JS, like in `FetchResponse.blob()`.
    if (isReactNativeBlobGlobal()) {
      return createReactNativeBlobAsync(buffer, type);
    }
    return new Blob([buffer], { type });
  }

  async text(): Promise<string> {
    return this.consumeAsText('text');
  }

  async json(): Promise<any> {
    return JSON.parse(await this.consumeAsText('json'));
  }

  async formData(): Promise<UniversalFormData> {
    const body = this._bodyInit;
    if (body instanceof FormData) {
      this.markConsumed('formData');
      return copyFormData(body) as UniversalFormData;
    }
    const contentType = this.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
      if (body != null) {
        this.markConsumed('formData');
      }
      throw new TypeError(
        `Failed to execute 'formData' on 'Request': the body can't be parsed as form data because its Content-Type is '${contentType}'. Use a FormData or URLSearchParams body, or set the Content-Type to 'application/x-www-form-urlencoded'.`
      );
    }
    // Mirrors the URL-encoded parsing in `FetchResponse.formData()`.
    const text = await this.consumeAsText('formData');
    const searchParams = new URLSearchParams(text);
    const formData = new FormData() as UniversalFormData;
    searchParams.forEach((value, key) => {
      formData.append(key, value);
    });
    return formData;
  }

  clone(): Request {
    if (this.bodyUsed) {
      throw new TypeError("Failed to execute 'clone' on 'Request': Request body is already used.");
    }
    let body = this._bodyInit;
    if (body instanceof ReadableStream) {
      // A stream can be read only once, so tee it: this request keeps one branch and the clone
      // gets the other, per the Fetch spec.
      const [ownBranch, cloneBranch] = body.tee();
      this._bodyInit = ownBranch;
      this.bodyStream = null;
      body = cloneBranch;
    }
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      credentials: this.credentials,
      redirect: this.redirect,
      signal: this.signal,
      mode: this.mode,
      cache: this.cache,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      integrity: this.integrity,
      keepalive: this.keepalive,
      body,
    });
  }

  private async consumeAsText(method: string): Promise<string> {
    const bytes = await this.consumeAsBytes(method);
    return new TextDecoder().decode(bytes);
  }

  private async consumeAsBytes(method: string): Promise<Uint8Array<ArrayBuffer>> {
    const body = this._bodyInit;
    // A null body can't be disturbed, so reading it doesn't mark the request as used.
    if (body == null) {
      return new Uint8Array(0);
    }
    this.markConsumed(method);
    if (body instanceof FormData) {
      const { body: bytes } = await convertFormDataAsync(body);
      return bytes as Uint8Array<ArrayBuffer>;
    }
    const { body: bytes } = await normalizeBodyInitAsync(body);
    return (bytes as Uint8Array<ArrayBuffer> | null) ?? new Uint8Array(0);
  }

  private markConsumed(method: string): void {
    if (this.bodyUsed) {
      throw new TypeError(
        `Failed to execute '${method}' on 'Request': Request body is already used.`
      );
    }
    this.consumed = true;
  }

  private setDefaultContentType(): void {
    if (this._bodyInit == null || this.headers.has('content-type')) {
      return;
    }
    if (typeof this._bodyInit === 'string') {
      this.headers.set('content-type', 'text/plain;charset=UTF-8');
    } else if (this._bodyInit instanceof Blob && this._bodyInit.type) {
      this.headers.set('content-type', this._bodyInit.type);
    } else if (this._bodyInit instanceof URLSearchParams) {
      this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
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
