import { extractFlagSpecs, mergeFlagSpecs, type CommandFlagSpec } from '../commandFlags';

const at = (source: string) => extractFlagSpecs('src/example.ts', source);

describe(extractFlagSpecs, () => {
  it(`reads a strict parse: the schema const and the command name it is given`, () => {
    expect(
      at(
        [
          `const WAIT_ARGS = { '--timeout': String, '--json': Boolean, '-h': '--help' };`,
          `const args = parseArgsOrThrow(WAIT_ARGS, argv, 'dev:stop');`,
        ].join('\n')
      ).specs
    ).toEqual([
      {
        command: 'dev:stop',
        flags: ['--timeout', '--json', '-h'],
        // `--json` is a `Boolean` and takes no value; `-h` is an alias of one.
        valueFlags: ['--timeout'],
        forwardsUnknownFlags: false,
        positionalArgs: 'unknown',
      },
    ]);
  });

  it(`reads an alias as carrying whatever its target carries`, () => {
    expect(
      at(
        [
          `const ARGS = { '--platform': String, '-p': '--platform', '--json': Boolean, '-j': '--json' };`,
          `const args = parseArgsOrThrow(ARGS, argv, 'build:wait');`,
        ].join('\n')
      ).specs[0]?.valueFlags
    ).toEqual(['--platform', '-p']);
  });

  it(`reads an inline schema, the permissive flag and the positional policy of an entry parse`, () => {
    expect(
      at(
        `const args = assertWithOptionsArgs({ '--help': Boolean }, { argv, permissive: true, command: 'dev', positionalArgs: 'own' });`
      ).specs
    ).toEqual([
      {
        command: 'dev',
        flags: ['--help'],
        valueFlags: [],
        forwardsUnknownFlags: true,
        positionalArgs: 'own',
      },
    ]);
  });

  it(`takes both branches of a schema chosen by a conditional`, () => {
    expect(
      at(
        [
          `const A = { '--duration': String };`,
          `const B = { '--fail-on-error': Boolean };`,
          `const args = parseArgsOrThrow(x ? A : B, argv, 'runtime:errors');`,
        ].join('\n')
      ).specs[0]?.flags
    ).toEqual(['--duration', '--fail-on-error']);
  });

  it(`follows a spread of another schema declared in the same file`, () => {
    expect(
      at(
        [
          `const SHARED = { '--json': Boolean };`,
          `const OWN = { ...SHARED, '--force': Boolean };`,
          `const args = parseArgsOrThrow(OWN, argv, 'dev:stop');`,
        ].join('\n')
      ).specs[0]?.flags
    ).toEqual(['--json', '--force']);
  });

  it(`reports a parse whose command name is computed, instead of guessing one`, () => {
    const scan = at(
      [
        `const ARGS = { '--json': Boolean };`,
        'const args = parseArgsOrThrow(ARGS, argv, `runtime:${action}`);',
      ].join('\n')
    );
    expect(scan.specs).toEqual([]);
    expect(scan.unreadable).toEqual([
      {
        file: 'src/example.ts',
        line: 2,
        nameExpression: '`runtime:${action}`',
      },
    ]);
  });

  it(`reports a parse whose schema comes from another module, rather than a partial list`, () => {
    // A partial list is worse than none: it would reject options the command really accepts.
    const scan = at(`const args = parseArgsOrThrow(IMPORTED_ARGS, argv, 'impact');`);
    expect(scan.specs).toEqual([]);
    expect(scan.unreadable).toHaveLength(1);
  });
});

describe(mergeFlagSpecs, () => {
  const spec = (
    command: string,
    flags: string[],
    forwardsUnknownFlags = false,
    positionalArgs: CommandFlagSpec['positionalArgs'] = 'unknown'
  ): CommandFlagSpec => ({
    command,
    flags,
    valueFlags: [],
    forwardsUnknownFlags,
    positionalArgs,
  });

  it(`unions the entry parse and the resolver parse of one command`, () => {
    const merged = mergeFlagSpecs([
      spec('dev:stop', ['--help', '-h'], true),
      spec('dev:stop', ['--timeout', '--json']),
    ]);
    expect(merged.get('dev:stop')).toEqual({
      command: 'dev:stop',
      flags: ['--help', '-h', '--timeout', '--json'],
      valueFlags: [],
      // One strict parse is enough to make an unknown option an error, whatever the entry did.
      forwardsUnknownFlags: false,
      positionalArgs: 'unknown',
    });
  });

  it(`lets one site's "none" settle the positional policy, because that site rejects first`, () => {
    const merged = mergeFlagSpecs([
      spec('typecheck', ['--help'], true, 'none'),
      spec('typecheck', ['--json']),
    ]);
    expect(merged.get('typecheck')?.positionalArgs).toBe('none');
  });

  it(`stays permissive only when every parse of the command was`, () => {
    const merged = mergeFlagSpecs([spec('start', ['--help'], true), spec('start', ['-h'], true)]);
    expect(merged.get('start')?.forwardsUnknownFlags).toBe(true);
  });

  it(`gives a group's actions the group's schema when they parse under its name`, () => {
    // `skills:list` is the `skills` module with an action in front of it, so the options are the
    // group's — but only where the action declares none of its own.
    const merged = mergeFlagSpecs([spec('skills', ['--json', '--dry-run'])]);
    expect(merged.get('skills:list')?.flags).toEqual(['--json', '--dry-run']);
  });

  it(`leaves an action that has its own schema alone`, () => {
    const merged = mergeFlagSpecs([
      spec('runtime', ['--help'], true),
      spec('runtime:eval', ['--timeout']),
    ]);
    expect(merged.get('runtime:eval')).toEqual({
      command: 'runtime:eval',
      flags: ['--timeout'],
      valueFlags: [],
      forwardsUnknownFlags: false,
      positionalArgs: 'unknown',
    });
  });

  it(`answers for dev out of the two lists dev really checks against`, () => {
    // `dev` parses permissively and then refuses anything outside `src/dev/knownFlags.ts`, so its
    // option list is that file's and not its `arg` schema's.
    const flags = mergeFlagSpecs([]).get('dev');
    expect(flags?.forwardsUnknownFlags).toBe(false);
    expect(flags?.flags).toEqual(expect.arrayContaining(['--detach', '--wait-ready', '--tunnel']));
    expect(mergeFlagSpecs([]).get('dev:run')?.flags).toEqual(flags?.flags);
  });
});
