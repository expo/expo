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
  it(`parses complex with string arrays`, () => {
    expect(
      parseVariadicArguments(
        [
          'bacon',
          '@evan/bacon',
          '--yarn=one',
          '-g',
          '@evan/bacon/foobar.js',
          '--pattern',
          './1',
          '--pattern',
          '2.js',
          '--arr',
          'a,b,c',
          '--',
          '--npm',
        ],
        ['--pattern', '--arr', '--yarn']
      )
    ).toEqual({
      variadic: ['bacon', '@evan/bacon', '@evan/bacon/foobar.js'],
      extras: ['--npm'],
      flags: { '--yarn': 'one', '-g': true, '--pattern': ['./1', '2.js'], '--arr': 'a,b,c' },
    });
  });

  it(`groups known flags as an array across formats`, () => {
    expect(parseVariadicArguments(['--yarn=one', '--yarn', '--yarn', 'two'], ['--yarn'])).toEqual({
      variadic: [],
      extras: [],
      flags: { '--yarn': ['one', true, 'two'] },
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
    ).toThrow('Did you mean: chalk -- -D');
  });

  it(`splits unknown flags and combines existing extras`, () => {
    expect(() =>
      assertUnexpectedVariadicFlags(['--npm'], {
        variadic: ['chalk'],
        flags: { '-D': true },
        extras: ['--ignore-scripts'],
      })
    ).toThrow('Did you mean: chalk -- --ignore-scripts -D');
  });

  it(`accepts empty variadic`, () => {
    expect(() =>
      assertUnexpectedVariadicFlags(['--pnpm'], {
        variadic: [],
        flags: { '--ignore-scripts': true, '-D': true },
        extras: [],
      })
    ).toThrow('Did you mean: -- --ignore-scripts -D');
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
    ).toThrow('Did you mean: npx expo install chalk -- -D');
  });
});
