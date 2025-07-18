import { areDetentsValid, isInitialDetentIndexValid } from '../utils';

describe(areDetentsValid, () => {
  describe('valid detents', () => {
    it.each([
      { detents: [0, 0.5, 1] },
      { detents: [0.1, 0.2, 0.9] },
      { detents: [0.5] },
      { detents: [1] },
      { detents: [0] },
      { detents: null },
      { detents: undefined },
      { detents: 'fitToContents' } as const,
    ])('areDetentsValid($detents) returns true', (input) => {
      // @ts-expect-error
      expect(areDetentsValid(input.detents)).toBe(true);
    });
  });

  describe('invalid detents', () => {
    it.each([
      { detents: [] },
      { detents: [0.5, 0.1, 1] },
      { detents: [0.9, 0.2, 0.1] },
      { detents: [0, '0.5', 1] },
      { detents: ['0', '0.5', '1'] },
      { detents: [-0.1, 0.5, 1] },
      { detents: [0, 1.1] },
      { detents: [2, 3] },
      { detents: 0.5 },
    ])('areDetentsValid($detents) returns false', (input) => {
      // @ts-expect-error
      expect(areDetentsValid(input.detents)).toBe(false);
    });
  });
});

describe(isInitialDetentIndexValid, () => {
  describe('valid initialDetentIndex', () => {
    it.each([
      { detents: [0, 0.5, 1], detentIndex: 1 },
      { detents: [0.1, 0.2, 0.9], detentIndex: 2 },
      { detents: [0.1, 0.9], detentIndex: 'last' },
      { detents: [0.5], detentIndex: 0 },
      { detents: [1], detentIndex: null },
      { detents: [0], detentIndex: undefined },
      { detents: null, detentIndex: 0 },
      { detents: undefined, detentIndex: null },
      { detents: 'fitToContents', detentIndex: 0 } as const,
    ])('isInitialDetentIndexValid($detents, $initialDetentIndex) returns true', (input) => {
      // @ts-expect-error
      expect(isInitialDetentIndexValid(input.detents, input.detentIndex)).toBe(true);
    });
  });

  describe('invalid initialDetentIndex', () => {
    it.each([
      { detents: [0, 0.5, 1], detentIndex: 3 },
      { detents: [0.1, 0.2, 0.9], detentIndex: -1 },
      { detents: [0.5], detentIndex: 1 },
      { detents: 'fitToContents', detentIndex: 1 } as const,
    ])('isInitialDetentIndexValid($detents, $initialDetentIndex) returns false', (input) => {
      expect(isInitialDetentIndexValid(input.detents, input.detentIndex)).toBe(false);
    });
  });
});
