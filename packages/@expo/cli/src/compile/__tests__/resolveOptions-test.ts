import { resolveOptions } from '../resolveOptions';

describe(resolveOptions, () => {
  it(`resolves --output-dir from the project root`, () => {
    expect(resolveOptions('/app', { mode: 'development', outputDir: 'build' })).toEqual({
      mode: 'development',
      outputDir: '/app/build',
    });
  });
});
