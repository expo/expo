import { parseVariadicArguments, assertUnexpectedVariadicFlags } from '../variadic';

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

describe(assertUnexpectedVariadicFlags, () => {
  it(`splits unknown flags into extras`, () => {
    expect(() =>
      assertUnexpectedVariadicFlags(['--yarn'], {
        variadic: ['chalk'],
        flags: { '-D': true },
        extras: [],
      })
    ).toThrowError('Did you mean: chalk -- -D');
  });

  it(`splits unknown flags and combines existing extras`, () => {
    expect(() =>
      assertUnexpectedVariadicFlags(['--npm'], {
        variadic: ['chalk'],
        flags: { '-D': true },
        extras: ['--ignore-scripts'],
      })
    ).toThrowError('Did you mean: chalk -- --ignore-scripts -D');
  });

  it(`accepts empty variadic`, () => {
    expect(() =>
      assertUnexpectedVariadicFlags(['--pnpm'], {
        variadic: [],
        flags: { '--ignore-scripts': true, '-D': true },
        extras: [],
      })
    ).toThrowError('Did you mean: -- --ignore-scripts -D');
  });

  it('prepends command prefix', () => {
    expect(() =>
      assertUnexpectedVariadicFlags(
        ['--yarn'],
        {
          variadic: ['chalk'],
          flags: { '-D': true },
          extras: [],
        },
        'npx expo install'
      )
    ).toThrowError('Did you mean: npx expo install chalk -- -D');
  });
});
