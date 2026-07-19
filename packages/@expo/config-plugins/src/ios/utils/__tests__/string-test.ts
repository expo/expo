import { trimQuotes } from '../string';

describe(trimQuotes, () => {
  it('trims quotes', () => {
    expect(trimQuotes('"dominik sokal"')).toBe('dominik sokal');
  });

  it('returns the same string if there are no quotes', () => {
    expect(trimQuotes('dominik sokal')).toBe('dominik sokal');
  });
});
