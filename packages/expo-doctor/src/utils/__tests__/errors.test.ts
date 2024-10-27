import { isNetworkError } from '../errors';

describe(isNetworkError, () => {
  it('returns true for ENOTFOUND', () => {
    const error = new Error('ENOTFOUND');
    // @ts-ignore
    error.cause = { code: 'ENOTFOUND' };
    expect(isNetworkError(error)).toBe(true);
  });

  it('returns true for generic network error message', () => {
    const error = new Error('fetch failed');
    expect(isNetworkError(error)).toBe(true);
  });

  it('returns false for other errors', () => {
    const error = new Error('Something went wrong');
    expect(isNetworkError(error)).toBe(false);
  });
});
