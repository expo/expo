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
    const buffer = await this.arrayBuffer();
    return new Blob([buffer]);
  }

  async formData(): Promise<UniversalFormData> {
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
    const text = await this.text();
    return JSON.parse(text);
  }

  async bytes(): Promise<Uint8Array<ArrayBuffer>> {
    return new Uint8Array(await this.arrayBuffer());
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

  clone(): Response {
    throw new Error('Not implemented');
  }

  private finalize = (): void => {
    this.removeListener('readyForJSFinalization', this.finalize);

    this.abortCleanupFunction();

    this.removeAllListeners('didReceiveResponseData');
    this.removeAllListeners('didComplete');
    this.removeAllListeners('didFailWithError');
  };
}
