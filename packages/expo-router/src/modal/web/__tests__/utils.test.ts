import { getInitialDetentIndex } from '../utils';

describe(getInitialDetentIndex, () => {
  it.each([
    { detents: [0, 0.5, 1], detentIndex: 1, expected: 1 },
    { detents: [0.1, 0.2, 0.9], detentIndex: 2, expected: 2 },
    { detents: [0.1, 0.9], detentIndex: 'last', expected: 1 },
    { detents: [0.5], detentIndex: 0, expected: 0 },
    { detents: [1], detentIndex: null, expected: 0 },
    { detents: [0], detentIndex: undefined, expected: 0 },
    { detents: null, detentIndex: 0, expected: 0 },
    { detents: undefined, detentIndex: null, expected: 0 },
    { detents: 'fitToContents', detentIndex: 0, expected: 0 } as const,
  ])('getInitialDetentIndex($options) returns expected value', (input) => {
    expect(
      getInitialDetentIndex({
        // @ts-expect-error
        sheetAllowedDetents: input.detents,
        // @ts-expect-error
        sheetInitialDetentIndex: input.detentIndex,
      })
    ).toBe(input.expected);
  });
});
