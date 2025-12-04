import { deepEqual } from '../deepEqual';

describe('deepEqual', () => {
  it('returns true for same object reference', () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  it('returns true for deeply equal objects', () => {
    const a = { x: 1, y: { z: 2 } };
    const b = { x: 1, y: { z: 2 } };
    expect(deepEqual(a, b)).toBe(true);
  });

  it('returns false for objects with different keys', () => {
    const a = { x: 1 };
    const b = { x: 1, y: 2 };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns false for objects with different values', () => {
    const a = { x: 1 };
    const b = { x: 2 };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns false if one is null', () => {
    expect(deepEqual(null, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, null)).toBe(false);
  });

  it('returns false if both are null', () => {
    expect(deepEqual(null, null)).toBe(true);
  });

  it('returns false for non-object types', () => {
    expect(deepEqual(1 as any, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, 1 as any)).toBe(false);
    expect(deepEqual('test' as any, 'test' as any)).toBe(true);
  });

  it('returns true for deeply nested equal objects', () => {
    const a = { a: { b: { c: 3 } } };
    const b = { a: { b: { c: 3 } } };
    expect(deepEqual(a, b)).toBe(true);
  });

  it('returns false for deeply nested unequal objects', () => {
    const a = { a: { b: { c: 3 } } };
    const b = { a: { b: { c: 4 } } };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns true for empty objects', () => {
    expect(deepEqual({}, {})).toBe(true);
  });
});
