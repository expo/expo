import { ExpoFetchModule } from './ExpoFetchModule';
import type { NativeResponse } from './NativeRequest';

const ConcreteNativeResponse = ExpoFetchModule.NativeResponse as typeof NativeResponse;
export type AbortSubscriptionCleanupFunction = () => void;

// FormData from react-native is not compatible with the web standard.
// We need to extend it with the react-native FormData.
type RNFormData = Awaited<ReturnType<globalThis.Response['formData']>>;
type UniversalFormData = globalThis.FormData & RNFormData;

/**
 * A response implementation for the `fetch.Response` API.
 */
export class FetchResponse extends ConcreteNativeResponse implements Response {
  private streamingState: 'none' | 'started' | 'completed' = 'none';
  private bodyStream: ReadableStream<Uint8Array<ArrayBuffer>> | null = null;
  private consumed = false;
  private wasCloned = false;

  constructor(private readonly abortCleanupFunction: AbortSubscriptionCleanupFunction) {
    super();
    this.addListener('readyForJSFinalization', this.finalize);
  }

  get body(): ReadableStream<Uint8Array<ArrayBuffer>> | null {
    if (this.bodyStream == null) {
      const response = this;

      // This flag prevents enqueuing data after the stream is closed or canceled.
      // Because it might be too late for the multithreaded native code to stop enqueuing data,
      // we cannot simply rely on the native code to stop sending `didReceiveResponseData`.
      let isControllerClosed = false;

      this.bodyStream = new ReadableStream({
        start(controller) {
          if (response.streamingState === 'completed') {
            return;
          }
          response.addListener('didReceiveResponseData', (data: Uint8Array<ArrayBuffer>) => {
            if (!isControllerClosed) {
              controller.enqueue(data);
            }
          });

          response.addListener('didComplete', () => {
            controller.close();
            isControllerClosed = true;
          });

          response.addListener('didFailWithError', (error: string) => {
            controller.error(new Error(error));
            isControllerClosed = true;
          });
        },
        async pull(controller) {
          if (response.streamingState === 'none') {
            const completedData = await response.startStreaming();
            if (completedData != null) {
              if (!isControllerClosed) {
                controller.enqueue(completedData);
                controller.close();
                isControllerClosed = true;
              }
              response.streamingState = 'completed';
            } else {
              response.streamingState = 'started';
            }
          } else if (response.streamingState === 'completed') {
            controller.close();
            isControllerClosed = true;
          }
        },
        cancel(reason) {
          response.cancelStreaming(String(reason));
          isControllerClosed = true;
        },
      });
    }
    return this.bodyStream;
  }

  override get bodyUsed(): boolean {
    // After clone(), each branch tracks its own reads via its wrapper, and
    // streamingState would flip on either branch's read, so we ignore it here.
    if (this.wasCloned) {
      return this.consumed;
    }

    return this.consumed || this.streamingState !== 'none';
  }

  get headers(): Headers {
    return new Headers(this._rawHeaders);
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  public readonly type = 'default';

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
    this.consumed = true;

    if (this.wasCloned) {
      return this.readBodyAsBuffer();
    }

    return super.arrayBuffer();
  }

  override async text(): Promise<string> {
    this.checkBodyUsedError('text');
    this.consumed = true;

    if (this.wasCloned) {
      return new TextDecoder().decode(await this.readBodyAsBuffer());
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

    // Build the clone without running the native constructor. Native getters
    // (status, url, etc.) are shadowed by own properties with the snapshot values.
    const clone = Object.create(FetchResponse.prototype) as FetchResponse;

    Object.defineProperties(clone, {
      _rawHeaders: { value: this._rawHeaders, configurable: true },
      status: { value: this.status, configurable: true },
      statusText: { value: this.statusText, configurable: true },
      url: { value: this.url, configurable: true },
      redirected: { value: this.redirected, configurable: true },
      type: { value: 'default', configurable: true },
    });

    Reflect.set(clone, 'streamingState', 'none');
    Reflect.set(clone, 'consumed', false);
    Reflect.set(clone, 'wasCloned', true);

    // Tee so both responses can be read independently. Each branch is wrapped so
    // the first read flips the right consumed flag (otherwise bodyUsed lies).
    let clonedBodyStream: ReadableStream<Uint8Array<ArrayBuffer>> | null = null;

    if (this.body != null) {
      const [s1, s2] = this.body.tee();
      this.bodyStream = this.wrapBodyStreamWithConsumption(s1, this);
      clonedBodyStream = this.wrapBodyStreamWithConsumption(s2, clone);
    }

    this.wasCloned = true;
    Reflect.set(clone, 'bodyStream', clonedBodyStream);

    return clone;
  }

  private wrapBodyStreamWithConsumption(
    source: ReadableStream<Uint8Array<ArrayBuffer>>,
    target: FetchResponse
  ): ReadableStream<Uint8Array<ArrayBuffer>> {
    const reader = source.getReader();
    let markedConsumed = false;

    return new ReadableStream(
      {
        async pull(controller) {
          if (!markedConsumed) {
            markedConsumed = true;
            target.consumed = true;
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
        async cancel(reason) {
          await reader.cancel(reason);
        },
      },
      {
        // Keep pull lazy. The default highWaterMark of 1 would fire pull at
        // construction and flip consumed before anything had actually been read.
        highWaterMark: 0,
      }
    );
  }

  private checkBodyUsedError(method: string): void {
    if (this.bodyUsed || this.bodyStream?.locked === true) {
      throw new TypeError(
        `Failed to execute '${method}' on 'Response': Response body is already used.`
      );
    }
  }

  private async readBodyAsBuffer(): Promise<ArrayBuffer> {
    if (this.body == null) {
      return new ArrayBuffer(0);
    }

    const reader = this.body.getReader();
    const chunks: Uint8Array[] = [];
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
