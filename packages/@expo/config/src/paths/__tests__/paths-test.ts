import { ensureSlash, getEntryPointWithExtensions } from '../paths';

// TODO: Bacon: Add test for resolving entry point
// TODO: Bacon: Add test for custom config paths

describe(ensureSlash, () => {
  it(`ensures the ending slash is added`, () => {
    expect(ensureSlash('', true)).toBe('/');
    expect(ensureSlash('/', true)).toBe('/');
  });
  it(`ensures the ending slash is removed`, () => {
    expect(ensureSlash('', false)).toBe('');
    expect(ensureSlash('/', false)).toBe('');
  });
});

describe(getEntryPointWithExtensions, () => {
  // Allow legacy versions to continue to use the getEntry without the last argument 'mode'
  it(`doesn't throw when mode isn't defined`, () => {
    // Test that it throws the error after the config error.
    // This error is thrown because the mock FS isn't implemented.
    expect(() => getEntryPointWithExtensions('/', [], [])).toThrow(
      `The expected package.json path: /package.json does not exist`
    );
  });
});

// getEntryPoint;
