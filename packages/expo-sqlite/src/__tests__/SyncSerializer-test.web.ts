// Copyright 2015-present 650 Industries. All rights reserved.

import { serialize, deserialize } from '../../web/SyncSerializer';

describe('SyncSerializer', () => {
  describe('Error serialization', () => {
    it('should serialize and deserialize Error objects with message', () => {
      const error = new Error('Test error message');
      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error).toBeInstanceOf(Error);
      expect(deserialized.error.message).toBe('Test error message');
    });

    it('should preserve Error enumerable properties like code', () => {
      const error = new Error('UNIQUE constraint failed');
      (error as any).code = 19;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error & { code: number } }>(serialized);

      expect(deserialized.error).toBeInstanceOf(Error);
      expect(deserialized.error.message).toBe('UNIQUE constraint failed');
      expect(deserialized.error.code).toBe(19);
    });

    it('should preserve Error stack trace', () => {
      const error = new Error('Test error');
      const originalStack = error.stack;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.stack).toBe(originalStack);
    });

    it('should handle nested Error objects', () => {
      const innerError = new Error('Inner error');
      (innerError as any).code = 42;

      const data = {
        success: false,
        error: innerError,
        metadata: { timestamp: Date.now() },
      };

      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized.error).toBeInstanceOf(Error);
      expect(deserialized.error.message).toBe('Inner error');
      expect((deserialized.error as any).code).toBe(42);
    });

    it('should handle multiple enumerable properties on Error', () => {
      const error = new Error('Complex error');
      (error as any).code = 19;
      (error as any).errno = -4058;
      (error as any).path = '/some/file.db';

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.message).toBe('Complex error');
      expect((deserialized.error as any).code).toBe(19);
      expect((deserialized.error as any).errno).toBe(-4058);
      expect((deserialized.error as any).path).toBe('/some/file.db');
    });
  });

  describe('Uint8Array serialization', () => {
    it('should serialize and deserialize Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const serialized = serialize({ data });
      const deserialized = deserialize<{ data: Uint8Array }>(serialized);

      expect(deserialized.data).toBeInstanceOf(Uint8Array);
      expect(Array.from(deserialized.data)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle objects with both Error and Uint8Array', () => {
      const error = new Error('Binary error');
      (error as any).code = 99;
      const binary = new Uint8Array([0xff, 0xfe, 0xfd]);

      const data = { error, binary };
      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized.error).toBeInstanceOf(Error);
      expect(deserialized.error.message).toBe('Binary error');
      expect((deserialized.error as any).code).toBe(99);
      expect(deserialized.binary).toBeInstanceOf(Uint8Array);
      expect(Array.from(deserialized.binary)).toEqual([0xff, 0xfe, 0xfd]);
    });
  });

  describe('General serialization', () => {
    it('should handle regular objects', () => {
      const data = { foo: 'bar', num: 42, nested: { key: 'value' } };
      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should handle arrays', () => {
      const data = [1, 'two', { three: 3 }, [4, 5]];
      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should handle null and undefined', () => {
      const data = { a: null, b: undefined };
      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized.a).toBeNull();
      // Note: undefined values are dropped by JSON.stringify
      expect(deserialized.b).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000);
      const error = new Error(longMessage);
      (error as any).code = 999;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.message).toBe(longMessage);
      expect((deserialized.error as any).code).toBe(999);
    });

    it('should handle errors with unicode and special characters', () => {
      const error = new Error('错误: Ошибка: エラー: 🚨💥');
      (error as any).code = 42;
      (error as any).emoji = '😀';

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.message).toBe('错误: Ошибка: エラー: 🚨💥');
      expect((deserialized.error as any).emoji).toBe('😀');
    });

    it('should handle errors with null/undefined properties', () => {
      const error = new Error('Test error');
      (error as any).nullProp = null;
      (error as any).undefinedProp = undefined;
      (error as any).code = 0;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.message).toBe('Test error');
      expect((deserialized.error as any).nullProp).toBeNull();
      // undefined gets dropped by JSON
      expect((deserialized.error as any).code).toBe(0);
    });

    it('should handle empty error message', () => {
      const error = new Error('');
      (error as any).code = 100;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect(deserialized.error.message).toBe('');
      expect((deserialized.error as any).code).toBe(100);
    });

    it('should handle error with numeric properties', () => {
      const error = new Error('Numeric error');
      (error as any).code = 19;
      (error as any).errno = -4058;
      (error as any).line = 42;
      (error as any).column = 10;

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect((deserialized.error as any).code).toBe(19);
      expect((deserialized.error as any).errno).toBe(-4058);
      expect((deserialized.error as any).line).toBe(42);
      expect((deserialized.error as any).column).toBe(10);
    });

    it('should handle errors with array properties', () => {
      const error = new Error('Array error');
      (error as any).args = ['arg1', 'arg2', 123];

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect((deserialized.error as any).args).toEqual(['arg1', 'arg2', 123]);
    });

    it('should handle errors with object properties', () => {
      const error = new Error('Object error');
      (error as any).metadata = { userId: 123, action: 'insert' };

      const serialized = serialize({ error });
      const deserialized = deserialize<{ error: Error }>(serialized);

      expect((deserialized.error as any).metadata).toEqual({ userId: 123, action: 'insert' });
    });

    it('should handle large Uint8Array data', () => {
      const largeArray = new Uint8Array(50000);
      for (let i = 0; i < largeArray.length; i++) {
        largeArray[i] = i % 256;
      }

      const serialized = serialize({ data: largeArray });
      const deserialized = deserialize<{ data: Uint8Array }>(serialized);

      expect(deserialized.data.length).toBe(50000);
      expect(Array.from(deserialized.data.slice(0, 10))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle complex nested structures', () => {
      const error1 = new Error('First error');
      (error1 as any).code = 1;

      const error2 = new Error('Second error');
      (error2 as any).code = 2;

      const data = {
        errors: [error1, error2],
        binary: new Uint8Array([1, 2, 3]),
        nested: {
          error: error1,
          data: new Uint8Array([4, 5, 6]),
        },
      };

      const serialized = serialize(data);
      const deserialized = deserialize<typeof data>(serialized);

      expect(deserialized.errors[0]).toBeInstanceOf(Error);
      expect(deserialized.errors[0].message).toBe('First error');
      expect((deserialized.errors[0] as any).code).toBe(1);
      expect(deserialized.errors[1].message).toBe('Second error');
      expect(deserialized.binary).toBeInstanceOf(Uint8Array);
      expect(deserialized.nested.error).toBeInstanceOf(Error);
      expect(deserialized.nested.data).toBeInstanceOf(Uint8Array);
    });
  });
});
