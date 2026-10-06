import { resolveOptions } from '../resolveOptions';

describe(resolveOptions, () => {
  it(`resolves the options from the project root`, () => {
    expect(
      resolveOptions('/app', { mode: 'development', device: 'iPhone 18 Pro', outputDir: 'build' })
    ).toEqual({
      mode: 'development',
      device: 'iPhone 18 Pro',
      outputDir: '/app/build',
    });
  });
});
