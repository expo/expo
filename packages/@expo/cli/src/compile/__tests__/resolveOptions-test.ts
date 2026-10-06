import { resolveOptions } from '../resolveOptions';

describe(resolveOptions, () => {
  it(`resolves --output-dir from the project root`, () => {
    expect(resolveOptions('/app', { outputDir: 'build' })).toEqual({ outputDir: '/app/build' });
  });
});
