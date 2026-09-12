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
const RESULT_LENGTH_HEADER_SIZE = 4;

let hasWarnedSync = false;

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
  if (syncTrait) {
    const { lockBuffer, resultBuffer } = syncTrait;
    const lock = new Int32Array(lockBuffer);
    const resultArray = new Uint8Array(resultBuffer);
    let resultJson = error != null ? serialize({ error }) : serialize({ result });
    let resultBytes = new TextEncoder().encode(resultJson);
    const resultCapacity = resultArray.byteLength - RESULT_LENGTH_HEADER_SIZE;
    if (resultBytes.byteLength > resultCapacity) {
      resultJson = serialize({
        error: `Sync result too large for shared buffer: ${resultBytes.byteLength} bytes (maximum ${resultCapacity} bytes)`,
      });
      resultBytes = new TextEncoder().encode(resultJson);
    }
    new DataView(resultBuffer).setUint32(0, resultBytes.byteLength, true);
    resultArray.set(resultBytes, RESULT_LENGTH_HEADER_SIZE);
    Atomics.store(lock, 0, RESOLVED);
  } else {
    if (result) {
      self.postMessage({ id, result });
    } else {
      self.postMessage({ id, error });
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

  let i = 0;
  const useAtomicsPause = typeof Atomics.pause === 'function';
  while (Atomics.load(lock, 0) === PENDING) {
    ++i;

    if (useAtomicsPause) {
      if (i > 1_000_000) {
        throw new Error('Sync operation timeout');
      }
      Atomics.pause();
    } else {
      // NOTE(kudo): Unfortunate for the busy loop,
      // because we don't have a way for main thread to yield its execution to other callbacks.
      if (i > 1000_000_000) {
        throw new Error('Sync operation timeout');
      }
    }
  }

  const length = new DataView(resultBuffer).getUint32(0, true);
  if (length > resultArray.byteLength - RESULT_LENGTH_HEADER_SIZE) {
    throw new Error(`Invalid sync result length: ${length}`);
  }
  const resultCopy = new Uint8Array(length);
  resultCopy.set(new Uint8Array(resultArray.buffer, RESULT_LENGTH_HEADER_SIZE, length));
  const resultJson = new TextDecoder().decode(resultCopy);
  const { result, error } = deserialize<{ result: ResultTypeMap[T]; error?: string }>(resultJson);
  if (error) throw new Error(error);
  return result;
}
