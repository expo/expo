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
  it('rejects --check with --fix', async () => {
    await expect(resolveArgsAsync(['--check', '--fix'])).rejects.toMatchObject({
      code: 'BAD_ARGS',
      message: 'Specify at most one of: --check, --fix',
    });
  });
  it('rejects --json without --check', async () => {
    await expect(resolveArgsAsync(['--json'])).rejects.toMatchObject({
      code: 'BAD_ARGS',
      message: 'The --json flag can only be used with --check',
    });
  });
  it('allows --json with --check', async () => {
    await expect(resolveArgsAsync(['--json', '--check'])).resolves.toEqual({
      variadic: [],
      options: {
        npm: false,
        yarn: false,
        check: true,
        json: true,
        pnpm: false,
        bun: false,
        fix: false,
        dev: false,
        agentSkills: true,
      },
      extras: [],
    });
  });
  it('keeps arguments after -- separate from install options', async () => {
    await expect(
      resolveArgsAsync(['expo-camera', '--pnpm', '--', '--save-exact', '--ignore-scripts'])
    ).resolves.toEqual({
      variadic: ['expo-camera'],
      options: {
        npm: false,
        yarn: false,
        check: false,
        json: false,
        pnpm: true,
        bun: false,
        fix: false,
        dev: false,
        agentSkills: true,
      },
      extras: ['--save-exact', '--ignore-scripts'],
    });
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
        json: false,
        pnpm: false,
        bun: false,
        fix: false,
        dev: false,
        agentSkills: true,
        skillContext: true,
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
        json: false,
        pnpm: false,
        bun: false,
        fix: false,
        dev: false,
        agentSkills: true,
        skillContext: true,
      },
      extras: [],
    });
  });
  it(`disables agent skills with --no-agent-skills`, async () => {
    const result = await resolveArgsAsync(['expo-camera', '--no-agent-skills']);
    expect(result.options.agentSkills).toBe(false);
  });
  it(`disables the skill context output with --no-skill-context`, async () => {
    const result = await resolveArgsAsync(['expo-camera', '--no-skill-context']);
    expect(result.options.skillContext).toBe(false);
    expect(result.options.agentSkills).toBe(true);
  });
});
