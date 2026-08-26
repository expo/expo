import { binaryInputBytes } from '../web-utils';

describe('binaryInputBytes', () => {
  it('returns a Uint8Array unchanged', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(binaryInputBytes(bytes)).toBe(bytes);
  });

  it('wraps an ArrayBuffer', () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    expect(Array.from(binaryInputBytes(buffer))).toEqual([1, 2, 3]);
  });

  it('decodes a base64 string', () => {
    expect(Array.from(binaryInputBytes('AQID'))).toEqual([1, 2, 3]);
  });

  it('keeps the region of a Uint8Array that views part of a larger buffer', () => {
    const backing = new Uint8Array(64);
    backing.set([1, 2, 3], 16);
    const view = backing.subarray(16, 19);

    expect(Array.from(binaryInputBytes(view))).toEqual([1, 2, 3]);
  });

  it('keeps the region of a DataView', () => {
    const backing = new Uint8Array(64);
    backing.set([1, 2, 3], 16);
    const view = new DataView(backing.buffer, 16, 3);

    const bytes = binaryInputBytes(view as unknown as ArrayBuffer);
    expect(bytes.byteLength).toBe(3);
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });

  it('keeps the region of a non-Uint8Array typed view', () => {
    const backing = new Uint8Array(64);
    backing.set([1, 2, 3], 16);
    const view = new Int8Array(backing.buffer, 16, 3);

    const bytes = binaryInputBytes(view as unknown as ArrayBuffer);
    expect(bytes.byteLength).toBe(3);
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });
});
