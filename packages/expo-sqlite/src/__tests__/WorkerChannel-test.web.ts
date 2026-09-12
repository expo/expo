// Copyright 2015-present 650 Industries. All rights reserved.

import { sendWorkerResult, invokeWorkerSync } from '../../web/WorkerChannel';
import { ResultTypeMap } from '../../web/web.types';

// Polyfill TextEncoder/TextDecoder for test environment
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  (globalThis as any).TextEncoder = util.TextEncoder;
  (globalThis as any).TextDecoder = util.TextDecoder;
}

describe('WorkerChannel', () => {
  describe('sendWorkerResult', () => {
    it('should serialize error message and code for sync operations', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024 * 1024);
      const lock = new Int32Array(lockBuffer);
      const resultArray = new Uint8Array(resultBuffer);

      // Create an error with a code property (like SQLite errors)
      const error = new Error('UNIQUE constraint failed');
      (error as any).code = 19;

      sendWorkerResult({
        id: 1,
        result: null,
        error,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      // Verify the lock was set to RESOLVED (2)
      expect(Atomics.load(lock, 0)).toBe(2);

      // Decode and verify the serialized error
      const length = new Uint32Array(resultArray.buffer, 0, 1)[0];
      const resultBytes = new Uint8Array(resultArray.buffer, 4, length);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      // Verify error object is serialized with special marker
      expect(parsed.error).toHaveProperty('__error__', true);
      expect(parsed.error.message).toBe('UNIQUE constraint failed');
      expect(parsed.error.code).toBe(19);
    });

    it('should serialize result for sync operations', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024 * 1024);
      const lock = new Int32Array(lockBuffer);
      const resultArray = new Uint8Array(resultBuffer);

      const result: ResultTypeMap['run'] = { lastInsertRowId: 42, changes: 1, firstRowValues: [] };

      sendWorkerResult({
        id: 1,
        result,
        error: null,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      // Verify the lock was set to RESOLVED (2)
      expect(Atomics.load(lock, 0)).toBe(2);

      // Decode and verify the serialized result
      const length = new Uint32Array(resultArray.buffer, 0, 1)[0];
      const resultBytes = new Uint8Array(resultArray.buffer, 4, length);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.result).toEqual(result);
      expect(parsed.error).toBeUndefined();
    });
  });

  describe('invokeWorkerSync error handling', () => {
    let mockWorker: any;

    beforeEach(() => {
      mockWorker = {
        postMessage: jest.fn(),
      };
    });

    it('should throw error with message from worker', () => {
      // Mock Atomics.load to simulate immediate resolution
      let callCount = 0;
      // @ts-expect-error mocking Atomics.load with number return type
      jest.spyOn(Atomics, 'load').mockImplementation(() => {
        callCount++;
        // Return PENDING first, then RESOLVED
        return callCount === 1 ? 1 : 2;
      });

      // Mock the worker postMessage to simulate an error response
      mockWorker.postMessage = jest.fn((message: any) => {
        const { resultBuffer } = message;
        const lengthView = new Uint32Array(resultBuffer, 0, 1);
        const resultArray = new Uint8Array(resultBuffer);

        // Simulate worker sending back an error (matching serialized format)
        const errorResponse = JSON.stringify({
          error: {
            __error__: true,
            message: 'UNIQUE constraint failed',
            code: 19,
          },
        });
        const errorBytes = new TextEncoder().encode(errorResponse);
        lengthView[0] = errorBytes.length;
        resultArray.set(errorBytes, 4);
      });

      try {
        invokeWorkerSync(mockWorker, 'exec' as any, { nativeDatabaseId: 1, source: 'SELECT 1' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('UNIQUE constraint failed');
        expect(error.code).toBe(19);
      }

      jest.spyOn(Atomics, 'load').mockRestore();
    });
  });

  describe('Buffer length encoding edge cases', () => {
    it('should handle message at buffer boundary (1MB)', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024 * 1024);

      // Create a large error that's close to buffer limit
      const largeMessage = 'Error: ' + 'x'.repeat(1024 * 1024 - 200);
      const error = new Error(largeMessage);

      sendWorkerResult({
        id: 1,
        result: null,
        error,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      // Verify length was written correctly (4 bytes as Uint32)
      const lengthView = new Uint32Array(resultBuffer, 0, 1);
      const storedLength = lengthView[0];

      // Decode and verify
      const resultBytes = new Uint8Array(resultBuffer, 4, storedLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.error).toHaveProperty('__error__', true);
      expect(parsed.error.message.length).toBeGreaterThan(1024 * 1000);
    });

    it('should correctly encode length for small messages', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024);

      const error = new Error('Small');
      (error as any).code = 1;

      sendWorkerResult({
        id: 1,
        result: null,
        error,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      // Read the length (first 4 bytes as Uint32)
      const lengthView = new Uint32Array(resultBuffer, 0, 1);
      const storedLength = lengthView[0];

      // Verify length is reasonable (should be less than 200 bytes for this small error)
      expect(storedLength).toBeLessThan(200);
      expect(storedLength).toBeGreaterThan(0);

      // Verify we can decode it
      const resultBytes = new Uint8Array(resultBuffer, 4, storedLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.error.message).toBe('Small');
      expect(parsed.error.code).toBe(1);
    });

    it('should handle unicode characters in length calculation', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024);

      // Unicode characters take multiple bytes
      const error = new Error('🚨💥错误エラー');
      (error as any).code = 999;

      sendWorkerResult({
        id: 1,
        result: null,
        error,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      const lengthView = new Uint32Array(resultBuffer, 0, 1);
      const storedLength = lengthView[0];

      const resultBytes = new Uint8Array(resultBuffer, 4, storedLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.error.message).toBe('🚨💥错误エラー');
    });

    it('should handle empty result object', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024);

      sendWorkerResult({
        id: 1,
        result: {} as any,
        error: null,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      const lengthView = new Uint32Array(resultBuffer, 0, 1);
      const storedLength = lengthView[0];

      const resultBytes = new Uint8Array(resultBuffer, 4, storedLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.result).toEqual({});
    });

    it('should handle result with nested data', () => {
      const lockBuffer = new SharedArrayBuffer(4);
      const resultBuffer = new SharedArrayBuffer(1024);

      const result = {
        rows: [
          { id: 1, name: 'Alice', data: { age: 30 } },
          { id: 2, name: 'Bob', data: { age: 25 } },
        ],
        changes: 2,
      } as any;

      sendWorkerResult({
        id: 1,
        result,
        error: null,
        syncTrait: {
          lockBuffer,
          resultBuffer,
        },
      });

      const lengthView = new Uint32Array(resultBuffer, 0, 1);
      const storedLength = lengthView[0];

      const resultBytes = new Uint8Array(resultBuffer, 4, storedLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const parsed = JSON.parse(resultJson);

      expect(parsed.result.rows).toHaveLength(2);
      expect(parsed.result.rows[0].name).toBe('Alice');
      expect(parsed.result.changes).toBe(2);
    });
  });
});
