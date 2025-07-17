import { areDetentsValid } from '../utils';

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
