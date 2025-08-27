import type { ExtendedNativeTabOptions } from '../types';
import { shouldTabBeVisible } from '../utils';

describe('shouldTabBeVisible', () => {
  it('returns true when options.hidden is false', () => {
    const options: ExtendedNativeTabOptions = { hidden: false };
    expect(shouldTabBeVisible(options)).toBe(true);
  });

  it('returns false when options.hidden is true', () => {
    const options: ExtendedNativeTabOptions = { hidden: true };
    expect(shouldTabBeVisible(options)).toBe(false);
  });

  it('returns false when options.hidden is undefined', () => {
    const options: ExtendedNativeTabOptions = {};
    expect(shouldTabBeVisible(options)).toBe(false);
  });
});
