import { resolveUrlScheme } from '../utils';

describe(resolveUrlScheme, () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns a string scheme as is', () => {
    expect(resolveUrlScheme('myapp')).toBe('myapp');
  });

  it('returns undefined when no scheme is defined', () => {
    expect(resolveUrlScheme(undefined)).toBeUndefined();
  });

  it('returns the only scheme of an array without warning', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveUrlScheme(['myapp'])).toBe('myapp');
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns the first scheme of an array and warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveUrlScheme(['first', 'second'])).toBe('first');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"first"'));
  });

  it('warns only once for the same schemes', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    resolveUrlScheme(['repeated', 'again']);
    resolveUrlScheme(['repeated', 'again']);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
