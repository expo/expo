import { getDebuggerType } from '../getDebuggerType';

describe(getDebuggerType, () => {
  it('returns `chrome` for user agent from chrome', () => {
    expect(
      getDebuggerType(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      )
    ).toBe('chrome');
  });

  it('returns `vscode` for user agent from chrome', () => {
    expect(getDebuggerType('vscode/420.69.0')).toBe('vscode');
  });

  it('returns `unknown` non-existing user agent', () => {
    expect(getDebuggerType(null)).toBe('unknown');
  });
});
