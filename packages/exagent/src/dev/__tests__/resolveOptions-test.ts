import { resolveDevOptions } from '../resolveOptions';

describe(resolveDevOptions, () => {
  it(`should forward every argument the plan engine does not own`, () => {
    expect(resolveDevOptions(['--web', '--port', '8082'])).toEqual({
      mode: 'run',
      expoArgs: ['--web', '--port', '8082'],
      agentSkills: true,
      platform: 'web',
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should strip --no-agent-skills and skip the sync`, () => {
    expect(resolveDevOptions(['--no-agent-skills', '--clear'])).toEqual({
      mode: 'run',
      expoArgs: ['--clear'],
      agentSkills: false,
      platform: undefined,
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should run the plan without any mode flag`, () => {
    expect(resolveDevOptions([]).mode).toBe('run');
  });

  it(`should enter plan mode and strip the flag`, () => {
    expect(resolveDevOptions(['--plan', '--port', '8082'])).toEqual({
      mode: 'plan',
      expoArgs: ['--port', '8082'],
      agentSkills: true,
      platform: undefined,
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  // `--smart` and `--passthrough` were `exagent start`'s mode flags and this command has neither:
  // running the plan is what it does, and the plain `expo start` wrapper is `exagent start`.
  it.each(['--smart', '--passthrough'])(`should forward %s to the expo CLI`, (flag) => {
    const options = resolveDevOptions([flag]);

    expect(options.mode).toBe('run');
    expect(options.expoArgs).toEqual([flag]);
  });

  it(`should approve the plan up front with --yes and strip the flag`, () => {
    const options = resolveDevOptions(['--yes', '--clear']);

    expect(options.yes).toBe(true);
    expect(options.expoArgs).toEqual(['--clear']);
    expect(resolveDevOptions([]).yes).toBe(false);
  });

  it.each([
    ['--ios', 'ios'],
    ['-i', 'ios'],
    ['--android', 'android'],
    ['-a', 'android'],
    ['--web', 'web'],
    ['-w', 'web'],
  ])(`should read the platform from %s`, (flag, platform) => {
    expect(resolveDevOptions([flag]).platform).toBe(platform);
  });

  it(`should keep the platform flag in the expo start passthrough`, () => {
    expect(resolveDevOptions(['--ios']).expoArgs).toEqual(['--ios']);
  });

  it(`should use the first platform flag when several are given`, () => {
    expect(resolveDevOptions(['--android', '--ios']).platform).toBe('android');
  });

  it(`should ask for a JSON plan and strip the flag`, () => {
    expect(resolveDevOptions(['--plan', '--json'])).toEqual({
      mode: 'plan',
      expoArgs: [],
      agentSkills: true,
      platform: undefined,
      json: true,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should not ask for JSON without the flag`, () => {
    expect(resolveDevOptions(['--plan']).json).toBe(false);
  });

  it(`should report no platform when none is asked for`, () => {
    expect(resolveDevOptions(['--port', '8082']).platform).toBeUndefined();
  });

  it(`should suppress the follow-ups and strip the flag`, () => {
    expect(resolveDevOptions(['--no-followups', '--clear'])).toEqual({
      mode: 'run',
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      json: false,
      followups: false,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should keep the follow-ups without the flag`, () => {
    expect(resolveDevOptions([]).followups).toBe(true);
  });

  it(`should strip --no-checkpoint and skip the snapshot`, () => {
    const options = resolveDevOptions(['--no-checkpoint']);

    expect(options.checkpoint).toBe(false);
    expect(options.expoArgs).toEqual([]);
    expect(resolveDevOptions([]).checkpoint).toBe(true);
  });
});
