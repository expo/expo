import { parseVariadicArguments } from '../variadic';

describe(parseVariadicArguments, () => {
  it(`parses complex`, () => {
    expect(
      parseVariadicArguments([
        'bacon',
        '@evan/bacon',
        '--yarn',
        '-g',
        '@evan/bacon/foobar.js',
        './avocado.js',
        '--',
        '--npm',
      ])
    ).toEqual({
      variadic: ['bacon', '@evan/bacon', '@evan/bacon/foobar.js', './avocado.js'],
      extras: ['--npm'],
      flags: { '--yarn': true, '-g': true },
    });
  });
  it(`parses too many extras`, () => {
    expect(() => parseVariadicArguments(['avo', '--', '--npm', '--'])).toThrow(
      /Unexpected multiple --/
    );
  });
});
