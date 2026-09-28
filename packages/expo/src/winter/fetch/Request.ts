import { normalizeBodyInitAsync, normalizeMethod } from './RequestUtils';
import { convertFormDataAsync } from './convertFormData';
import type { FetchRequestInit } from './fetch.types';

// React Native's FormData is not fully compatible with the web standard, so the global FormData
// type carries extra members (e.g. `getParts`). Mirror `FetchResponse` and return the intersection.
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;

// Methods that may not carry a request body per the Fetch standard.
const BODYLESS_METHODS = new Set(['GET', 'HEAD']);

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

/**
 * A spec-compliant `Request` implementation for `expo/fetch`.
 *
 * React Native installs the `whatwg-fetch` polyfill as the global `Request`, which is not fully
 * spec-compliant and forces `expo/fetch` to reach into its private fields to recover the body.
 * This class lets `expo/fetch` own its `Request` so the body, headers, and metadata round-trip
 * predictably. It is installed as the global `Request` on native.
 */
export class Request implements Body {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly credentials: RequestCredentials;
  readonly redirect: RequestRedirect;
  readonly signal: AbortSignal;

  // The raw body input, kept so `fetch()` can normalize it without consuming the request.
  // Replaced by a tee branch when a stream body is cloned.
  _bodyInit: BodyInit | null;

  // Whether the body has been read/disturbed. The `bodyUsed` getter also factors in a locked
  // body stream.
  private consumed = false;
  // The lazily-created body stream. Cached so `.body` returns the same object across gets, and
  // so reading or locking it disturbs this request's body (sets `consumed`) per the Fetch spec.
  private bodyStream: ReadableStream<Uint8Array<ArrayBuffer>> | null = null;

  constructor(input: string | URL | Request, init?: FetchRequestInit) {
    let body: BodyInit | null | undefined = init?.body;
    let headers: HeadersInit | undefined = init?.headers;
    let method: string | undefined = init?.method;
    let credentials: RequestCredentials | undefined = init?.credentials;
    let redirect: RequestRedirect | undefined = init?.redirect;
    let signal: AbortSignal | null | undefined = init?.signal;

    if (isRequest(input)) {
      this.url = input.url;
      method ??= input.method;
      credentials ??= input.credentials;
      redirect ??= input.redirect;
      signal ??= input.signal;
      if (headers == null) {
        headers = input.headers;
      }
      // Reuse the source body when the init doesn't provide one, consuming the source.
      const sourceBody = body == null ? getRequestBodyInit(input) : null;
      if (sourceBody != null) {
        if (input.bodyUsed) {
          throw new TypeError(
            "Failed to construct 'Request': the source request body is already used. Create a new request with a fresh body, or clone the source request before reading its body."
          );
        }
        body = sourceBody;
        const source: object = input;
        if (source instanceof Request) {
          source.consumed = true;
        } else if (isWhatwgFetchRequest(source)) {
          source.bodyUsed = true;
        }
        // Other implementations only expose a `body` stream, which is disturbed once we read it.
      }
    } else {
      this.url = `${input}`;
    }

    this.method = method != null ? normalizeMethod(method) : 'GET';
    this.credentials = credentials ?? 'same-origin';
    this.redirect = redirect ?? 'follow';
    this.signal = signal ?? new AbortController().signal;
    this.headers = new Headers(headers);

    if (body != null && BODYLESS_METHODS.has(this.method)) {
      throw new TypeError('Request with GET/HEAD method cannot have body.');
    }

    this._bodyInit = body ?? null;
    this.setDefaultContentType();
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
    if (body instanceof Blob) {
      this.markConsumed('blob');
      return body;
    }
    const bytes = await this.consumeAsBytes('blob');
    return new Blob([bytes]);
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
      return body as UniversalFormData;
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
      body,
    });
  }

  private async consumeAsText(method: string): Promise<string> {
    const bytes = await this.consumeAsBytes(method);
    return new TextDecoder().decode(bytes);
  }

  private async consumeAsBytes(method: string): Promise<Uint8Array<ArrayBuffer>> {
    const body = this._bodyInit;
    this.markConsumed(method);
    if (body == null) {
      return new Uint8Array(0);
    }
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
