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

  it(`will collapse all occurrences of an alias`, () => {
    const arg = {
      '--platform': [String],
      '-p': '--platform',
    };
    const args = ['-p', 'web', '-p', 'ios'];
    const actual = collapseAliases(arg, args);
    expect(actual).toEqual(['--platform', 'web', '--platform', 'ios']);
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
    expect(() => assertUnknownArgs({}, ['--foo', '--bar'])).toThrow(
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
        { '--no-bundler': Boolean },
        { '--scheme': Boolean, '--device': Boolean, '-d': '--device' }
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
        { '--dev': Boolean },
        { '--minify': Boolean }
      )
    ).resolves.toEqual({
      args: {
        '--minify': 'true',
        '--dev': 'true',
      },
      projectRoot: 'custom-root',
    });
  });

  it(`handles array-type arguments in rawMap`, async () => {
    // This simulates `expo export -p web -p ios --source-maps`
    // Array-type args like --platform should be filtered out and not cause errors
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['-p', 'web', '-p', 'ios', '--source-maps'],
        { '--platform': [String], '-p': '--platform' },
        { '--source-maps': Boolean }
      )
    ).resolves.toEqual({
      args: {
        '--source-maps': true,
      },
      projectRoot: '.',
    });
  });

  it(`handles array-type arguments with extra args value`, async () => {
    // This simulates `expo export -p web -p ios --source-maps inline`
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['-p', 'web', '-p', 'ios', '--source-maps', 'inline', 'custom-root'],
        { '--platform': [String], '-p': '--platform' },
        { '--source-maps': Boolean }
      )
    ).resolves.toEqual({
      args: {
        '--source-maps': 'inline',
      },
      projectRoot: 'custom-root',
    });
  });

  it(`treats unrecognized value after string-or-boolean flag as project root when allowedValues is specified`, async () => {
    // With allowedValues, `--source-maps custom-root` treats `custom-root` as project root
    // because it's not in the allowed values list.
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['-p', 'web', '--source-maps', 'custom-root'],
        { '--platform': [String], '-p': '--platform' },
        // [Boolean, 'inline', 'external'] restricts to 'true', 'false', 'inline', 'external'
        { '--source-maps': [Boolean, 'inline', 'external'] }
      )
    ).resolves.toEqual({
      args: {
        '--source-maps': true,
      },
      projectRoot: 'custom-root',
    });
  });

  it(`treats value after string-or-boolean flag as flag value when no allowedValues specified`, async () => {
    // Without allowedValues, any value after the flag is treated as the flag's value
    await expect(
      resolveStringOrBooleanArgsAsync(
        ['-p', 'web', '--source-maps', 'custom-root'],
        { '--platform': [String], '-p': '--platform' },
        { '--source-maps': Boolean }
      )
    ).resolves.toEqual({
      args: {
        '--source-maps': 'custom-root',
      },
      projectRoot: '.',
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
  it(`does not assert for array-type arguments`, () => {
    const spec = {
      '--platform': [String],
      '-p': '--platform',
    };
    // Multiple --platform flags should be allowed when it's an array type
    expect(() =>
      assertDuplicateArgs(['--platform', 'web', '--platform', 'ios'], [['-p', '--platform']], spec)
    ).not.toThrow();
  });
});
