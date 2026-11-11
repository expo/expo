import { resolveSvgVariables } from '../Image';

describe('resolveSvgVariables', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns null when no variables are given', () => {
    expect(resolveSvgVariables(null)).toBeNull();
    expect(resolveSvgVariables(undefined)).toBeNull();
  });

  it('normalizes numbers to strings', () => {
    expect(resolveSvgVariables({ '--width': 1.5 })).toEqual({ '--width': '1.5' });
  });

  it('warns about a key that is missing the leading dashes', () => {
    // Such a key can never match a `var()` reference, so the fallback silently wins.
    expect(resolveSvgVariables({ roof: 'red' })).toEqual({ roof: 'red' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('roof');
  });

  it('does not warn about a well-formed key', () => {
    resolveSvgVariables({ '--roof': 'red' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once per offending key', () => {
    resolveSvgVariables({ roof: 'red', wall: 'blue', '--door': 'white' });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
