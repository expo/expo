// Copyright 2015-present 650 Industries. All rights reserved.

import { TextDecoder, TextEncoder } from 'node:util';

const { invokeWorkerSync, sendWorkerResult } = require('../../web/WorkerChannel');

describe('WorkerChannel sync transport', () => {
  const originalTextDecoder = globalThis.TextDecoder;
  const originalTextEncoder = globalThis.TextEncoder;

  beforeAll(() => {
    (globalThis as any).TextDecoder = TextDecoder;
    (globalThis as any).TextEncoder = TextEncoder;
  });

  afterAll(() => {
    if (originalTextDecoder === undefined) {
      delete (globalThis as any).TextDecoder;
    } else {
      globalThis.TextDecoder = originalTextDecoder;
    }
    if (originalTextEncoder === undefined) {
      delete (globalThis as any).TextEncoder;
    } else {
      globalThis.TextEncoder = originalTextEncoder;
    }
  });

  it('round-trips a UTF-8 payload larger than 255 bytes', () => {
    const payload = '🚀漢字'.repeat(100);
    const encodedPayload = new TextEncoder().encode(payload);
    expect(encodedPayload.byteLength).toBeGreaterThan(255);
    expect(encodedPayload.byteLength).not.toBe(payload.length);

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

  it('reports an oversized result and resolves the sync lock', () => {
    const payload = 'x'.repeat(1024 * 1024);
    let lock: Int32Array | undefined;
    const worker = {
      postMessage(message: any) {
        lock = new Int32Array(message.lockBuffer);
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

    let thrownError: Error | undefined;
    try {
      invokeWorkerSync(worker as unknown as Worker, 'open' as any, {} as any);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError?.message).toContain('Sync result too large for shared buffer');
    expect(thrownError?.message).not.toContain('Sync operation timeout');
    expect(Atomics.load(lock!, 0)).toBe(2);
  });

  it('rejects a decoded result length outside the buffer bounds', () => {
    const worker = {
      postMessage(message: any) {
        const lock = new Int32Array(message.lockBuffer);
        new DataView(message.resultBuffer).setUint32(0, message.resultBuffer.byteLength, true);
        Atomics.store(lock, 0, 2);
      },
    };

    expect(() => invokeWorkerSync(worker as unknown as Worker, 'open' as any, {} as any)).toThrow(
      'Invalid sync result length: 1048576'
    );
  });
});
