import { resolveArgsAsync } from '../resolveOptions';

describe(resolveArgsAsync, () => {
  it(`asserts invalid flags`, async () => {
    await expect(resolveArgsAsync(['-g', '--bacon'])).rejects.toThrow(/Unexpected: -g, --bacon/);
  });
  it(`prevents bad combos`, async () => {
    await expect(resolveArgsAsync(['--npm', '--yarn'])).rejects.toThrow(
      /Specify at most one of: --npm, --pnpm, --yarn/
    );
    await expect(resolveArgsAsync(['--npm', '--pnpm', '--yarn'])).rejects.toThrow(
      /Specify at most one of: --npm, --pnpm, --yarn/
    );
  });
  it(`allows known values`, async () => {
    const result = await resolveArgsAsync([
      'bacon',
      '@evan/bacon',
      '--yarn',
      'another@foobar',
      'file:../thing',
      '--',
      '--npm',
      '-g',
      'not-a-plugin',
    ]);
    expect(result).toEqual({
      variadic: ['bacon', '@evan/bacon', 'another@foobar', 'file:../thing'],
      options: {
        npm: false,
        yarn: true,
        check: false,
        pnpm: false,
        bun: false,
        fix: false,
      },
      extras: ['--npm', '-g', 'not-a-plugin'],
    });
  });
  it(`allows known values without correct chaining`, async () => {
    const result = await resolveArgsAsync(['expo', '--npm', '--check', '--']);
    expect(result).toEqual({
      variadic: ['expo'],
      options: {
        npm: true,
        yarn: false,
        check: true,
        pnpm: false,
        bun: false,
        fix: false,
      },
      extras: [],
    });
  });
});
