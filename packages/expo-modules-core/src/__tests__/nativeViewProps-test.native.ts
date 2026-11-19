import { SharedObject } from '../SharedObject';
import { diffPropValue } from '../nativeViewProps';

const deepDiffer = require('react-native/Libraries/Utilities/differ/deepDiffer').default;

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

describe('diffPropValue', () => {
  it(`matches deepDiffer of React Native for values without shared objects`, () => {
    const prevValues = createValues();
    const nextValues = createValues();
    const mismatches: { prevValue: unknown; nextValue: unknown; deepDiffer: boolean }[] = [];
    for (const prevValue of prevValues) {
      for (const nextValue of [...nextValues, prevValue]) {
        const expected = deepDiffer(prevValue, nextValue, deepDifferOptions);
        if (diffPropValue(prevValue, nextValue) !== expected) {
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
    expect(diffPropValue(sharedObject, otherSharedObject)).toBe(true);
    expect(diffPropValue([sharedObject], [otherSharedObject])).toBe(true);
    expect(diffPropValue({ a: sharedObject }, { a: otherSharedObject })).toBe(true);
    expect(diffPropValue(new Array(1), [sharedObject])).toBe(true);
    expect(diffPropValue(sharedObject, sharedObject)).toBe(false);
    expect(diffPropValue([sharedObject], [sharedObject])).toBe(false);
    expect(diffPropValue({ a: sharedObject }, { a: sharedObject })).toBe(false);
  });
});
