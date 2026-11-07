import { TextDecoder, TextEncoder } from 'util';

// `web/` is outside this tsconfig's rootDir, so load it untyped.
const {
  invokeWorkerAsync,
  invokeWorkerSync,
  sendWorkerResult,
  workerMessageHandler,
} = require('../../web/WorkerChannel');

// jsdom has no TextEncoder.
Object.assign(globalThis, { TextEncoder, TextDecoder });

function withAtomicsPause(pause: (() => void) | undefined, run: () => void) {
  const atomics = Atomics as unknown as { pause?: (n?: number) => void };
  const originalPause = atomics.pause;
  atomics.pause = pause;
  try {
    run();
  } finally {
    atomics.pause = originalPause;
  }
}

function pendingWorker(): Worker {
  return {
    postMessage() {
      // Leave the lock pending so the caller waits out the deadline.
    },
  } as unknown as Worker;
}

function createWorkerReplyingWith({
  result = null,
  error = null,
}: {
  result?: any;
  error?: Error | null;
}): Worker {
  return {
    postMessage: ({ id, isSync, lockBuffer, resultBuffer }) => {
      const syncTrait = isSync ? { lockBuffer, resultBuffer } : undefined;
      sendWorkerResult({ id, result, error, syncTrait });
    },
  } as Worker;
}

describe('Invoking the worker', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // The worker side posts async results through `self`.
    Object.defineProperty(globalThis, 'self', {
      configurable: true,
      value: { postMessage: (data: object) => workerMessageHandler({ data }) },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a sync result longer than 255 bytes', () => {
    const result = 'x'.repeat(300);
    const worker = createWorkerReplyingWith({ result });
    expect(invokeWorkerSync(worker, 'getColumnNames', { nativeStatementId: 0 })).toBe(result);
  });

  it('should throw when a sync result does not fit in the shared buffer', () => {
    const worker = createWorkerReplyingWith({ result: 'x'.repeat(1024 * 1024) });
    expect(() => invokeWorkerSync(worker, 'getColumnNames', { nativeStatementId: 0 })).toThrow(
      /Use the async API for large results/
    );
  });

  it('should throw the error message from the worker', () => {
    const worker = createWorkerReplyingWith({
      error: new Error('unable to close due to unfinalized statements'),
    });
    expect(() => invokeWorkerSync(worker, 'close', { nativeDatabaseId: 0 })).toThrow(
      'unable to close due to unfinalized statements'
    );
  });

  it('should throw the same message for sync and async calls', async () => {
    const worker = createWorkerReplyingWith({
      error: new Error('Error code 5: database is locked'),
    });
    expect(() => invokeWorkerSync(worker, 'close', { nativeDatabaseId: 0 })).toThrow(
      new Error('Error code 5: database is locked')
    );
    await expect(invokeWorkerAsync(worker, 'close', { nativeDatabaseId: 0 })).rejects.toThrow(
      new Error('Error code 5: database is locked')
    );
  });

  it('should throw when the error has an empty message', () => {
    const worker = createWorkerReplyingWith({ error: new Error('') });
    expect(() => invokeWorkerSync(worker, 'close', { nativeDatabaseId: 0 })).toThrow();
  });

  it('should throw an error message longer than 255 bytes', () => {
    const message = 'x'.repeat(300);
    const worker = createWorkerReplyingWith({ error: new Error(message) });
    expect(() => invokeWorkerSync(worker, 'close', { nativeDatabaseId: 0 })).toThrow(message);
  });

  it('times out a pending sync call at a wall-clock deadline when Atomics.pause exists', () => {
    // One pause stands in for 1µs, so a million pauses are 1s. After that budget the
    // clock jumps to the deadline. The wait has to read the clock to reach it.
    const deadlineMs = 15_000;
    let pauses = 0;
    let now = 0;
    const nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => {
      if (pauses > 1_000_000) {
        now = deadlineMs;
      }
      return now;
    });

    try {
      withAtomicsPause(
        () => {
          pauses += 1;
          if (pauses <= 1_000_000) {
            now = pauses * 0.001;
          }
        },
        () => {
          expect(() => invokeWorkerSync(pendingWorker(), 'close', { nativeDatabaseId: 0 })).toThrow(
            new Error('Sync operation timeout')
          );
          expect(now).toBeGreaterThanOrEqual(deadlineMs);
          expect(now).toBeLessThan(deadlineMs + 20);
        }
      );
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('times out a pending sync call at the same wall-clock deadline without Atomics.pause', () => {
    const deadlineMs = 15_000;
    let reads = 0;
    const nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => {
      reads += 1;
      // The first read anchors the deadline. The next read is at the deadline.
      return reads === 1 ? 0 : deadlineMs;
    });

    try {
      withAtomicsPause(undefined, () => {
        expect(() => invokeWorkerSync(pendingWorker(), 'close', { nativeDatabaseId: 0 })).toThrow(
          new Error('Sync operation timeout')
        );
        expect(reads).toBeGreaterThan(1);
        expect(reads).toBeLessThan(10);
      });
    } finally {
      nowSpy.mockRestore();
    }
  });
});
