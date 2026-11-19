import { SharedObject } from '../SharedObject';
import {
  addAttributeDiffing,
  addAttributeProcessing,
  deepDiffPropValue,
  processPropValue,
} from '../nativeViewProps';

const { isDeepStrictEqual } = require('util');
const deepDiffer = require('react-native/Libraries/Utilities/differ/deepDiffer').default;
const {
  create: createAttributePayload,
  diff: diffAttributePayload,
} = require('react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload');

// `ReactNativeAttributePayload` passes these options to `deepDiffer`.
const deepDifferOptions = { unsafelyIgnoreFunctions: true };

function firstFunction() {}
function secondFunction() {}

class Point {
  x: number;
  constructor(x: number) {
    this.x = x;
  }
}

/**
 * Returns new objects on each call, so that equal values don't share references.
 */
function createValues(): unknown[] {
  return [
    undefined,
    null,
    true,
    false,
    0,
    -0,
    1,
    NaN,
    '',
    'a',
    firstFunction,
    secondFunction,
    [],
    [1],
    [1, 2],
    [2, 1],
    new Array(1),
    [undefined],
    [null],
    [[1]],
    [[2]],
    [{ a: 1 }],
    [firstFunction],
    [secondFunction],
    {},
    { a: 1 },
    { a: 2 },
    { b: 1 },
    { a: 1, b: 2 },
    { a: undefined },
    { a: null },
    { a: { b: 1 } },
    { a: { b: 2 } },
    { a: [1] },
    { a: firstFunction },
    { a: secondFunction },
    Object.assign(Object.create(null), { a: 1 }),
    new Date(0),
    new Date(1),
    new Map([[1, 2]]),
    new Point(1),
    new Point(2),
    // Non-arrays with the `Array` constructor.
    Object.create(Array.prototype),
    { constructor: Array, length: 1, 0: 1 },
  ];
}

/**
 * Expects that React Native builds the same payloads with both attribute configs, for each value
 * and each pair of values.
 */
function expectSamePayloads(attributes: object, defaultAttributes: object) {
  const prevValues = createValues();
  const nextValues = createValues();
  const mismatches: object[] = [];
  for (const prevValue of prevValues) {
    const prevProps = { value: prevValue };
    const payload = createAttributePayload(prevProps, attributes);
    const defaultPayload = createAttributePayload(prevProps, defaultAttributes);
    if (!isDeepStrictEqual(payload, defaultPayload)) {
      mismatches.push({ props: prevProps, payload, defaultPayload });
    }
    for (const nextValue of [...nextValues, prevValue]) {
      const nextProps = { value: nextValue };
      const diffPayload = diffAttributePayload(prevProps, nextProps, attributes);
      const defaultDiffPayload = diffAttributePayload(prevProps, nextProps, defaultAttributes);
      if (!isDeepStrictEqual(diffPayload, defaultDiffPayload)) {
        mismatches.push({
          prevProps,
          nextProps,
          payload: diffPayload,
          defaultPayload: defaultDiffPayload,
        });
      }
    }
  }
  expect(mismatches).toEqual([]);
}

describe('deepDiffPropValue', () => {
  it(`matches deepDiffer of React Native for values without shared objects`, () => {
    const prevValues = createValues();
    const nextValues = createValues();
    const mismatches: { prevValue: unknown; nextValue: unknown; deepDiffer: boolean }[] = [];
    for (const prevValue of prevValues) {
      for (const nextValue of [...nextValues, prevValue]) {
        const expected = deepDiffer(prevValue, nextValue, deepDifferOptions);
        if (deepDiffPropValue(prevValue, nextValue) !== expected) {
          mismatches.push({ prevValue, nextValue, deepDiffer: expected });
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it(`compares shared objects by identity`, () => {
    const sharedObject = new SharedObject();
    const otherSharedObject = new SharedObject();
    // React Native sees no change between two shared objects of the same class.
    expect(deepDiffer(sharedObject, otherSharedObject, deepDifferOptions)).toBe(false);
    expect(deepDiffPropValue(sharedObject, otherSharedObject)).toBe(true);
    expect(deepDiffPropValue([sharedObject], [otherSharedObject])).toBe(true);
    expect(deepDiffPropValue({ a: sharedObject }, { a: otherSharedObject })).toBe(true);
    expect(deepDiffPropValue(new Array(1), [sharedObject])).toBe(true);
    expect(deepDiffPropValue(sharedObject, sharedObject)).toBe(false);
    expect(deepDiffPropValue([sharedObject], [sharedObject])).toBe(false);
    expect(deepDiffPropValue({ a: sharedObject }, { a: sharedObject })).toBe(false);
  });
});

describe('addAttributeProcessing', () => {
  it(`builds the same payloads as an attribute with only process`, () => {
    expectSamePayloads(addAttributeProcessing({ value: true }), {
      value: { process: processPropValue },
    });
  });
});

describe('addAttributeDiffing', () => {
  it(`builds the same payloads as an attribute without process and diff`, () => {
    expectSamePayloads(addAttributeDiffing({ value: true }), { value: true });
  });
});
