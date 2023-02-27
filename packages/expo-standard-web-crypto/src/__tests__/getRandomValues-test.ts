import * as Random from 'expo-crypto';

import getRandomValues, { getRandomValuesInsecure } from '../getRandomValues';

afterEach(() => {
  (Random.getRandomBytes as jest.Mock).mockClear();
});

test.each([
  ['Int8Array', Int8Array],
  ['Uint8Array', Uint8Array],
  ['Int16Array', Int16Array],
  ['Uint16Array', Uint16Array],
  ['Int32Array', Int32Array],
  ['Uint32Array', Uint32Array],
  ['Uint8ClampedArray', Uint8ClampedArray],
])(`fills %s with random values`, (_, TypedArray) => {
  const valueCount = 10;
  const array = new TypedArray(valueCount);
  const result = getRandomValues(array);
  expect(result).toBe(array);

  expect(Random.getRandomBytes).toHaveBeenCalledTimes(1);
  expect(Random.getRandomBytes).toHaveBeenCalledWith(valueCount * TypedArray.BYTES_PER_ELEMENT);

  // There is an ignorably infinitesimal chance the array is randomly all zeros
  const zeros = new TypedArray(valueCount);
  expect(array).not.toEqual(zeros);
});

test.each([
  ['nothing'],
  ['a plain array', []],
  ['a plain object', {}],
  ['a Float32Array', Float32Array],
  ['null', null],
])(`throws if given %s`, (_, ...values) => {
  expect(() => getRandomValues(...(values as [any]))).toThrow(TypeError);
});

test(`throws if requesting more than 65536 bytes`, () => {
  const oversized = new Int32Array(Math.ceil(65537 / Int32Array.BYTES_PER_ELEMENT));

  let error: any = undefined;
  try {
    getRandomValues(oversized);
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.name).toBe('QuotaExceededError');
  expect(error.code).toBe(22 /* QUOTA_EXCEEDED_ERR */);
});

describe(getRandomValuesInsecure, () => {
  test.each([
    ['Int8Array', Int8Array],
    ['Uint8Array', Uint8Array],
    ['Int16Array', Int16Array],
    ['Uint16Array', Uint16Array],
    ['Int32Array', Int32Array],
    ['Uint32Array', Uint32Array],
    ['Uint8ClampedArray', Uint8ClampedArray],
  ])(`fills %s with random values`, (_, TypedArray) => {
    const valueCount = 10;
    const array = new TypedArray(valueCount);
    const result = getRandomValuesInsecure(array);
    expect(result).toBe(array);

    // There is an ignorably infinitesimal chance the array is randomly all zeros
    const zeros = new TypedArray(valueCount);
    expect(array).not.toEqual(zeros);
  });
});
