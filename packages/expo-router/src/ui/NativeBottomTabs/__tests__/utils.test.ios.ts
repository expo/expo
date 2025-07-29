import type { NativeTabOptions } from '../NativeTabsView';
import { shouldTabBeVisible } from '../utils';

describe('shouldTabBeVisible', () => {
  it('returns true when options.hidden is false', () => {
    const options: NativeTabOptions = { hidden: false };
    expect(shouldTabBeVisible(options)).toBe(true);
  });

  it('returns false when options.hidden is true', () => {
    const options: NativeTabOptions = { hidden: true };
    expect(shouldTabBeVisible(options)).toBe(false);
  });

  it('returns false when options.hidden is undefined', () => {
    const options: NativeTabOptions = {};
    expect(shouldTabBeVisible(options)).toBe(false);
  });
});
