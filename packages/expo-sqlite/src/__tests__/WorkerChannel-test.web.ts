import { invokeWorkerSync, sendWorkerResult } from '../../web/WorkerChannel';

describe('WorkerChannel sync transport', () => {
  beforeAll(() => {
    // jsdom in the version used in jest-expo doesn't support TextEncoder/TextDecoder, so we need to mock them
    // Remove this once jest-environment-jsdom update their jsdom dependency to > 27.4.0 and jest-expo dependencies are updated
    if (typeof globalThis.TextEncoder === 'undefined') {
      (globalThis as any).TextEncoder = class {
        encode(value: string) {
          const bytes = new Uint8Array(value.length);
          for (let i = 0; i < value.length; i++) {
            bytes[i] = value.charCodeAt(i);
          }
          return bytes;
        }
      };
    }
    if (typeof globalThis.TextDecoder === 'undefined') {
      (globalThis as any).TextDecoder = class {
        decode(value: Uint8Array) {
          let result = '';
          for (let i = 0; i < value.length; i++) {
            result += String.fromCharCode(value[i]);
          }
          return result;
        }
      };
    }
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('decodes payloads larger than 255 bytes', () => {
    const payload = 'x'.repeat(300);
    const worker = {
      postMessage(message: any) {
        sendWorkerResult({
          id: message.id,
          result: { payload } as any,
          error: null,
          syncTrait: {
            lockBuffer: message.lockBuffer,
            resultBuffer: message.resultBuffer,
          },
        });
      },
    };

    const result = invokeWorkerSync(worker as unknown as Worker, 'open' as any, {} as any) as {
      payload: string;
    };
    expect(result.payload).toBe(payload);
  });
});
