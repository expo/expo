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

/**
 * Returns pairs of values that differ only in a shared object of the same class.
 */
function createSharedObjectChanges(): [unknown, unknown][] {
  const sharedObject = new SharedObject();
  const otherSharedObject = new SharedObject();
  return [
    [sharedObject, otherSharedObject],
    [[sharedObject], [otherSharedObject]],
    [{ a: sharedObject }, { a: otherSharedObject }],
  ];
}

/**
 * Expects that React Native drops each change from `createSharedObjectChanges` with the default
 * attribute config, and sends the processed next value with the attribute config.
 */
function expectSentSharedObjectChanges(
  attributes: object,
  defaultAttributes: object,
  process: (value: unknown) => unknown
) {
  for (const [prevValue, nextValue] of createSharedObjectChanges()) {
    const prevProps = { value: prevValue };
    const nextProps = { value: nextValue };
    // React Native sees no change between shared objects of the same class.
    expect(diffAttributePayload(prevProps, nextProps, defaultAttributes)).toBeNull();
    expect(diffAttributePayload(prevProps, nextProps, attributes)?.value).toBe(process(nextValue));
  }
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

  it(`finds a new shared object of the same class, unlike deepDiffer of React Native`, () => {
    for (const [prevValue, nextValue] of createSharedObjectChanges()) {
      expect(deepDiffer(prevValue, nextValue, deepDifferOptions)).toBe(false);
      expect(deepDiffPropValue(prevValue, nextValue)).toBe(true);
    }
  });

  it(`compares shared objects by identity`, () => {
    const sharedObject = new SharedObject();
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

  it(`sends a new shared object that an attribute with only process drops`, () => {
    expectSentSharedObjectChanges(
      addAttributeProcessing({ value: true }),
      { value: { process: processPropValue } },
      processPropValue
    );
  });
});

describe('addAttributeDiffing', () => {
  it(`builds the same payloads as an attribute without process and diff`, () => {
    expectSamePayloads(addAttributeDiffing({ value: true }), { value: true });
  });

  it(`sends a new shared object that an attribute without process and diff drops`, () => {
    expectSentSharedObjectChanges(
      addAttributeDiffing({ value: true }),
      { value: true },
      (value) => value
    );
  });
});
