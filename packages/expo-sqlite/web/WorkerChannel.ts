// Copyright 2015-present 650 Industries. All rights reserved.

import { Deferred } from './Deferred';
import { serialize, deserialize } from './SyncSerializer';
import {
  type SQLiteWorkerMessageType,
  type MessageTypeMap,
  type ResultType,
  type ResultTypeMap,
} from './web.types';

let messageId = 0;
const deferredMap = new Map<number, Deferred>();
const PENDING = 1;
const RESOLVED = 2;
/** How long a synchronous call may block the main thread after the worker has loaded. */
const SYNC_OPERATION_TIMEOUT_MS = 15_000;
/** Reading the clock on every busy-loop turn is several times slower. */
const SYNC_CLOCK_CHECK_SPINS = 4096;
export const SYNC_WORKER_NOT_READY_MESSAGE =
  'The SQLite web worker has not finished loading. This call returns immediately so the main thread stays free while the worker loads. Retry after the worker has finished loading, or await openDatabaseAsync() once.';

let hasWarnedSync = false;
let workerReady = false;
let workerInitError: string | null = null;

/**
 * Records whether the web worker has finished loading SQLite.
 * Pass `'ready'` after a successful load, `{ error }` when loading fails, or `'loading'` to clear that state.
 */
export function markSQLiteWebWorkerReady(state: 'ready' | 'loading' | { error: string }): void {
  if (state === 'ready') {
    workerReady = true;
    workerInitError = null;
    return;
  }
  workerReady = false;
  workerInitError = state === 'loading' ? null : state.error;
}

/**
 * Clears a finished wasm load error so the caller can post `init` again.
 * Returns false while a load is still in progress or after it has succeeded.
 */
export function beginSyncWorkerLoadRetry(): boolean {
  if (workerReady || workerInitError == null) {
    return false;
  }
  workerInitError = null;
  return true;
}

/**
 * Throws when a synchronous call must return before it posts to the worker.
 */
export function assertSyncWorkerCanPost(): void {
  if (!workerReady) {
    throw new Error(workerInitError ?? SYNC_WORKER_NOT_READY_MESSAGE);
  }
}

/**
 * For worker to send result to the main thread.
 */
export function sendWorkerResult({
  id,
  result,
  error,
  syncTrait,
}: {
  id: number;
  result: ResultType | null;
  error: Error | null;
  syncTrait?: {
    lockBuffer: SharedArrayBuffer;
    resultBuffer: SharedArrayBuffer;
  };
}) {
  // Send the message as a string. An Error doesn't survive JSON, and `String(error)` keeps it non-empty.
  const errorMessage = error != null ? error.message || String(error) : null;
  if (syncTrait) {
    const { lockBuffer, resultBuffer } = syncTrait;
    const lock = new Int32Array(lockBuffer);
    let resultBytes = new TextEncoder().encode(
      errorMessage != null ? serialize({ error: errorMessage }) : serialize({ result })
    );
    if (resultBytes.length + 4 > resultBuffer.byteLength) {
      resultBytes = new TextEncoder().encode(
        serialize({
          error: `The synchronous result is ${resultBytes.length} bytes, which is more than the ${resultBuffer.byteLength - 4} bytes that synchronous calls can return on web. Use the async API for large results.`,
        })
      );
    }
    new Uint32Array(resultBuffer, 0, 1)[0] = resultBytes.length;
    new Uint8Array(resultBuffer).set(resultBytes, 4);
    Atomics.store(lock, 0, RESOLVED);
  } else {
    if (error != null) {
      self.postMessage({ id, error: errorMessage });
    } else {
      self.postMessage({ id, result });
    }
  }
}

/**
 * For main thread to handle worker messages.
 */
export function workerMessageHandler(event: MessageEvent) {
  const { id, result, error, isSync } = event.data;
  if (!isSync) {
    const deferred = deferredMap.get(id);
    if (deferred) {
      if (error) {
        deferred.reject(new Error(error));
      } else {
        deferred.resolve(result);
      }
      deferredMap.delete(id);
    }
  }
}

/**
 * For main thread to invoke worker function asynchronously.
 */
export async function invokeWorkerAsync<T extends SQLiteWorkerMessageType & keyof ResultTypeMap>(
  worker: Worker,
  type: T,
  data: MessageTypeMap[T]['data']
): Promise<ResultTypeMap[T]> {
  const id = messageId++;
  const deferred = new Deferred<ResultTypeMap[T]>();
  deferredMap.set(id, deferred);
  worker.postMessage({ type, id, data, isSync: false });
  return deferred.getPromise();
}

/**
 * For main thread to invoke worker function synchronously.
 */
export function invokeWorkerSync<T extends SQLiteWorkerMessageType & keyof ResultTypeMap>(
  worker: Worker,
  type: T,
  data: MessageTypeMap[T]['data']
): ResultTypeMap[T] {
  // The worker finishes loading SQLite only while the main thread is free.
  // Spinning before that load finishes blocks the load until this call gives up.
  assertSyncWorkerCanPost();

  if (__DEV__ && !hasWarnedSync) {
    console.warn(
      'Using synchronous SQLite operations can cause significant performance impact. Consider using async operations instead.'
    );
    hasWarnedSync = true;
  }

  const id = messageId++;
  const lockBuffer = new SharedArrayBuffer(4);
  const lock = new Int32Array(lockBuffer);
  const resultBuffer = new SharedArrayBuffer(1024 * 1024);
  const resultArray = new Uint8Array(resultBuffer);

  Atomics.store(lock, 0, PENDING);
  worker.postMessage({
    type,
    id,
    data,
    isSync: true,
    lockBuffer,
    resultBuffer,
  });

  // NOTE(kudo): Unfortunate for the busy loop,
  // because we don't have a way for main thread to yield its execution to other callbacks.
  let spins = 0;
  const deadline = performance.now() + SYNC_OPERATION_TIMEOUT_MS;
  // @ts-expect-error: Remove this when TypeScript supports Atomics.pause
  const useAtomicsPause = typeof Atomics.pause === 'function';
  while (Atomics.load(lock, 0) === PENDING) {
    if (spins % SYNC_CLOCK_CHECK_SPINS === 0 && performance.now() >= deadline) {
      throw new Error('Sync operation timeout');
    }
    spins += 1;
    if (useAtomicsPause) {
      // @ts-expect-error: Remove this when TypeScript supports Atomics.pause
      Atomics.pause();
    }
  }

  const length = new Uint32Array(resultArray.buffer, 0, 1)[0];
  const resultCopy = new Uint8Array(length);
  resultCopy.set(new Uint8Array(resultArray.buffer, 4, length));
  const resultJson = new TextDecoder().decode(resultCopy);
  const { result, error } = deserialize<{ result: ResultTypeMap[T]; error?: string }>(resultJson);
  if (error) throw new Error(error);
  return result;
}
