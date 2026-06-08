import { ExpoFetchModule } from './ExpoFetchModule';
import type { NativeHeadersType, NativeResponse } from './NativeRequest';

const ConcreteNativeResponse = ExpoFetchModule.NativeResponse as typeof NativeResponse;
export type AbortSubscriptionCleanupFunction = () => void;

// FormData from react-native is not compatible with the web standard.
// We need to extend it with the react-native FormData.
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;

// Snapshot used by clones so their metadata getters skip the native side.
interface ResponseMetadata {
  readonly rawHeaders: NativeHeadersType;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly redirected: boolean;
}

const stateKey = Symbol('FetchResponse.state');

interface ConsumptionWrapper {
  stream: ReadableStream<Uint8Array<ArrayBuffer>>;
  // Stops the wrapper from marking its body as consumed. Called by clone()
  // when reads start coming through tee internals instead of from the user.
  detach: () => void;
}

function wrapWithConsumption(
  source: ReadableStream<Uint8Array<ArrayBuffer>>,
  body: Body
): ConsumptionWrapper {
  const reader = source.getReader();
  let markedConsumed = false;
  let markedDetached = false;

  const stream = new ReadableStream(
    {
      async pull(controller) {
        if (!markedConsumed && !markedDetached) {
          markedConsumed = true;
          body.consumed = true;
        }

        try {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            reader.releaseLock();
          } else {
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
          reader.releaseLock();
        }
      },
      cancel(reason) {
        if (!markedConsumed && !markedDetached) {
          markedConsumed = true;
          body.consumed = true;
        }

        // ReadableStreamTee uses a single shared cancelPromise that only
        // resolves once both branches are canceled, so awaiting here would
        // hang whenever the user cancels just one side.
        reader.cancel(reason).catch(() => {});
      },
    },
    {
      // Keep pull lazy. The default highWaterMark of 1 would fire pull at
      // construction and flip consumed before anything had actually been read.
      highWaterMark: 0,
    }
  );

  return {
    stream,
    detach: () => {
      markedDetached = true;
    },
  };
}

// JS-side body state. Held behind the stateKey symbol slot.
class Body {
  streamingState: 'none' | 'started' | 'completed' = 'none';
  stream: ReadableStream<Uint8Array<ArrayBuffer>> | null = null;
  cloned: boolean;
  consumed = false;

  // Detach fn for the wrapper currently held in `stream`. Null until the
  // first clone wraps the native stream.
  detach: (() => void) | null = null;

  constructor({ cloned }: { cloned: boolean }) {
    this.cloned = cloned;
  }

  get used(): boolean {
    // After clone(), each branch tracks its own reads via its wrapper, and
    // streamingState would flip on either branch's read, so we ignore it here.
    if (this.cloned) {
      return this.consumed;
    }

    return this.consumed || this.streamingState !== 'none';
  }

  async readAsBuffer(): Promise<ArrayBuffer> {
    if (this.stream == null) {
      return new ArrayBuffer(0);
    }

    const reader = this.stream.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let length = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (!done) {
          chunks.push(value);
          length += value.byteLength;
        } else {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    const output = new Uint8Array(length);
    let offset = 0;

    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return output.buffer;
  }
}

// metadata is null for originals (they read from native) and set for clones.
interface State {
  body: Body;
  metadata: ResponseMetadata | null;
}

/**
 * A response implementation for the `fetch.Response` API.
 */
export class FetchResponse extends ConcreteNativeResponse implements Response {
  private [stateKey]: State = {
    body: new Body({ cloned: false }),
    metadata: null,
  };

  constructor(private readonly abortCleanupFunction: AbortSubscriptionCleanupFunction) {
    super();
    this.addListener('readyForJSFinalization', this.finalize);
  }

  // Originals have metadata=null and fall through to the native getter via super.
  // Clones carry a snapshot and stand alone.

  override get _rawHeaders(): NativeHeadersType {
    return this[stateKey].metadata?.rawHeaders ?? super._rawHeaders;
  }

  override get status(): number {
    return this[stateKey].metadata?.status ?? super.status;
  }

  override get statusText(): string {
    return this[stateKey].metadata?.statusText ?? super.statusText;
  }

  override get url(): string {
    return this[stateKey].metadata?.url ?? super.url;
  }

  override get redirected(): boolean {
    return this[stateKey].metadata?.redirected ?? super.redirected;
  }

  get type(): 'default' {
    return 'default';
  }

  get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
    const body = this[stateKey].body;

    if (body.stream == null) {
      // This flag prevents enqueuing data after the stream is closed or canceled.
      // Because it might be too late for the multithreaded native code to stop enqueuing data,
      // we cannot simply rely on the native code to stop sending `didReceiveResponseData`.
      let isControllerClosed = false;

      body.stream = new ReadableStream(
        {
          start: (controller) => {
            if (body.streamingState === 'completed') {
              return;
            }

            this.addListener('didReceiveResponseData', (data: Uint8Array<ArrayBuffer>) => {
              if (!isControllerClosed) {
                controller.enqueue(data);
              }
            });

            this.addListener('didComplete', () => {
              if (isControllerClosed) {
                return;
              }
              isControllerClosed = true;
              controller.close();
            });

            this.addListener('didFailWithError', (error: string) => {
              if (isControllerClosed) {
                return;
              }
              isControllerClosed = true;
              controller.error(new Error(error));
            });
          },

          pull: async (controller) => {
            if (body.streamingState === 'none') {
              const completedData = await this.startStreaming();

              if (completedData != null) {
                if (!isControllerClosed) {
                  controller.enqueue(completedData);
                  controller.close();
                  isControllerClosed = true;
                }

                body.streamingState = 'completed';
              } else {
                body.streamingState = 'started';
              }
            } else if (body.streamingState === 'completed') {
              controller.close();
              isControllerClosed = true;
            }
          },

          cancel: (reason) => {
            this.cancelStreaming(String(reason));
            isControllerClosed = true;
          },
        },
        {
          // Keep pull lazy. The default highWaterMark of 1 would fire pull at
          // construction and flip streamingState before anything had actually
          // been read, making bodyUsed return true after merely touching .body.
          highWaterMark: 0,
        }
      );
    }
    return body.stream;
  }

  override get bodyUsed(): boolean {
    return this[stateKey].body.used;
  }

  get headers(): Headers {
    return new Headers(this._rawHeaders);
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  /**
   * This method is not currently supported by react-native's Blob constructor.
   */
  async blob(): Promise<Blob> {
    this.checkBodyUsedError('blob');
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  async formData(): Promise<UniversalFormData> {
    this.checkBodyUsedError('formData');

    // Reference implementation:
    // https://chromium.googlesource.com/chromium/src/+/ed9f0b5933cf5ffb413be1ca844de5be140514bf/third_party/blink/renderer/core/fetch/body.cc#120
    const text = await this.text();
    const searchParams = new URLSearchParams(text);
    const formData = new FormData() as UniversalFormData;

    searchParams.forEach((value, key) => {
      formData.append(key, value);
    });

    return formData;
  }

  async json(): Promise<any> {
    this.checkBodyUsedError('json');
    const text = await this.text();
    return JSON.parse(text);
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    this.checkBodyUsedError('bytes');
    return new Uint8Array(await this.arrayBuffer());
  }

  override async arrayBuffer(): Promise<ArrayBuffer> {
    this.checkBodyUsedError('arrayBuffer');

    const body = this[stateKey].body;
    body.consumed = true;

    if (body.cloned) {
      return body.readAsBuffer();
    }

    return super.arrayBuffer();
  }

  override async text(): Promise<string> {
    this.checkBodyUsedError('text');

    const body = this[stateKey].body;
    body.consumed = true;

    if (body.cloned) {
      return new TextDecoder().decode(await body.readAsBuffer());
    }

    return super.text();
  }

  toString(): string {
    return `FetchResponse: { status: ${this.status}, statusText: ${this.statusText}, url: ${this.url} }`;
  }

  toJSON(): object {
    return {
      status: this.status,
      statusText: this.statusText,
      redirected: this.redirected,
      url: this.url,
    };
  }

  clone(): FetchResponse {
    this.checkBodyUsedError('clone');

    const state = this[stateKey];
    // Object.create skips the native constructor. The clone reads metadata
    // from its own snapshot, so it doesn't touch native after this.
    const clone = Object.create(FetchResponse.prototype) as FetchResponse;

    const cloneState: State = {
      body: new Body({ cloned: true }),
      metadata: {
        rawHeaders: this._rawHeaders.slice(),
        status: this.status,
        statusText: this.statusText,
        url: this.url,
        redirected: this.redirected,
      },
    };

    Object.defineProperty(clone, stateKey, {
      value: cloneState,
      configurable: true,
      writable: true,
    });

    // Tee so both responses can be read independently. Each branch is wrapped
    // so the first read flips the right consumed flag (otherwise bodyUsed lies).
    if (this.body != null) {
      // Detach the existing wrapper so reads via the new tee don't flip
      // this body's consumed flag through it.
      state.body.detach?.();

      const [stream1, stream2] = this.body.tee();
      const own = wrapWithConsumption(stream1, state.body);
      const sibling = wrapWithConsumption(stream2, cloneState.body);

      state.body.stream = own.stream;
      state.body.detach = own.detach;

      cloneState.body.stream = sibling.stream;
      cloneState.body.detach = sibling.detach;
    }

    state.body.cloned = true;

    return clone;
  }

  private checkBodyUsedError(method: string): void {
    const body = this[stateKey].body;

    if (body.used || body.stream?.locked === true) {
      throw new TypeError(
        `Failed to execute '${method}' on 'Response': Response body is already used.`
      );
    }
  }

  private finalize = (): void => {
    this.removeListener('readyForJSFinalization', this.finalize);

    this.abortCleanupFunction();

    this.removeAllListeners('didReceiveResponseData');
    this.removeAllListeners('didComplete');
    this.removeAllListeners('didFailWithError');
  };
}

Object.defineProperty(FetchResponse.prototype, Symbol.toStringTag, {
  value: 'Response',
  configurable: true,
});
