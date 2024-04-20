import {
  assertUnknownArgs,
  resolveStringOrBooleanArgsAsync,
  assertDuplicateArgs,
  collapseAliases,
  _resolveStringOrBooleanArgs,
} from '../resolveArgs';

describe(collapseAliases, () => {
  it(`will collapse aliases into arguments`, () => {
    const arg = {
      '--basic': Boolean,
      '--help': Boolean,
      '-h': '--help',
    };
    const args = ['--basic', '-h'];
    const actual = collapseAliases(arg, args);
    expect(actual).toEqual(['--basic', '--help']);
  });
});

describe(_resolveStringOrBooleanArgs, () => {
  it(`resolves string or boolean arguments to boolean`, () => {
    expect(
      _resolveStringOrBooleanArgs(
        {
          '--basic': Boolean,
          // This will be omitted since we should handle collapsing aliases earlier.
          '-b': 'foobar',
        },
        ['--basic']
      )
    ).toEqual({
      args: { '--basic': true },
      projectRoot: '.',
    });
  });
  it(`resolves to string`, () => {
    expect(_resolveStringOrBooleanArgs({ '--basic': Boolean }, ['--basic', 'foobar'])).toEqual({
      args: { '--basic': 'foobar' },
      // foobar will be used as the string value for basic and not as the project root
      projectRoot: '.',
    });
  });
  it(`resolves to string with custom project root`, () => {
    expect(
      _resolveStringOrBooleanArgs({ '--basic': Boolean }, ['--basic', 'foobar', 'root'])
    ).toEqual({
      args: { '--basic': 'foobar' },
      projectRoot: 'root',
    });
  });
  it(`asserts invalid arguments`, () => {
    expect(() =>
      _resolveStringOrBooleanArgs({ '--basic': Boolean }, ['foobar', 'root', '--basic'])
    ).toThrow(/Unknown argument: root/);
  });
  it(`prefers last argument when arguments are repeated`, () => {
    expect(
      _resolveStringOrBooleanArgs({ '--basic': Boolean }, [
        '--basic',
        'true',
        '--basic',
        'false',
        'root',
      ])
    ).toEqual({
      args: { '--basic': 'false' },
      projectRoot: 'root',
    });
  });
});

describe(assertUnknownArgs, () => {
  it(`asserts unknown arguments`, () => {
    expect(() => assertUnknownArgs({}, ['--foo', '--bar'])).toThrowError(
      `Unknown arguments: --foo, --bar`
    );
  });
  it(`does not throw when there are no unknown arguments`, () => {
    expect(() =>
      assertUnknownArgs(
        {
          '--foo': Boolean,
          '--bar': Boolean,
        },
        ['--foo', '--bar']
      )
    ).not.toThrow();
  });
});

describe(resolveStringOrBooleanArgsAsync, () => {
  it(`parses complex arguments`, async () => {
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['--no-bundler', '--scheme', '-d', 'my-device', 'custom-root'],
        {
          '--no-bundler': Boolean,
        },
        {
          '--scheme': Boolean,
          '--device': Boolean,
          '-d': '--device',
        }
      )
    ).resolves.toEqual({
      args: {
        '--device': 'my-device',
        '--no-bundler': true,
        '--scheme': true,
      },
      projectRoot: 'custom-root',
    });
  });

  it(`prefers last argument, when argument is repeated`, async () => {
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['--dev=false', '--minify=false', '--minify', 'true', '--dev', 'true', 'custom-root'],
        {
          '--dev': Boolean,
        },
        {
          '--minify': Boolean,
        }
      )
    ).resolves.toEqual({
      args: {
        '--minify': 'true',
        '--dev': 'true',
      },
      projectRoot: 'custom-root',
    });
  });
});

describe(assertDuplicateArgs, () => {
  it(`does not assert`, () => {
    assertDuplicateArgs([], []);
    assertDuplicateArgs(['--foo', '--bar'], [['--device', '-d']]);
  });
  it(`asserts duplicate arguments`, () => {
    expect(() =>
      assertDuplicateArgs(['--device', '--bar', '--device'], [['--device', '-d']])
    ).toThrowErrorMatchingInlineSnapshot(`"Can only provide one instance of --device or -d"`);
  });
});
