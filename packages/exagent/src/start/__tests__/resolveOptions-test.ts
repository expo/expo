import { resolveStartOptions } from '../resolveOptions';

describe(resolveStartOptions, () => {
  it(`should forward every argument to expo start`, () => {
    expect(resolveStartOptions(['--web', '--port', '8082'])).toEqual({
      mode: 'smart',
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
    expect(resolveStartOptions(['--no-agent-skills', '--clear'])).toEqual({
      mode: 'smart',
      expoArgs: ['--clear'],
      agentSkills: false,
      platform: undefined,
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should plan and run the plan without any mode flag`, () => {
    expect(resolveStartOptions([]).mode).toBe('smart');
  });

  it(`should enter plan mode and strip the flag`, () => {
    expect(resolveStartOptions(['--plan', '--port', '8082'])).toEqual({
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

  it(`should accept --smart as an alias of the default and strip the flag`, () => {
    expect(resolveStartOptions(['--smart', '--clear'])).toEqual({
      mode: 'smart',
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should enter passthrough mode and strip the flag`, () => {
    expect(resolveStartOptions(['--passthrough', '--clear'])).toEqual({
      mode: 'passthrough',
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      json: false,
      followups: true,
      checkpoint: true,
      yes: false,
    });
  });

  it(`should forward the arguments after -- to expo start in passthrough mode`, () => {
    // The separator itself reaches `expo start` too, exactly as it did when the plain wrapper
    // was the default of this command.
    expect(resolveStartOptions(['--passthrough', '--', '--web']).expoArgs).toEqual(['--', '--web']);
  });

  it(`should only emit the plan when both plan flags are given`, () => {
    expect(resolveStartOptions(['--smart', '--plan']).mode).toBe('plan');
  });

  it(`should only emit the plan when --plan and --passthrough are given`, () => {
    expect(resolveStartOptions(['--passthrough', '--plan']).mode).toBe('plan');
  });

  it(`should not plan when --passthrough and --smart are given`, () => {
    // Asking for the untouched `expo start` is the narrower request of the two, so it wins.
    expect(resolveStartOptions(['--smart', '--passthrough']).mode).toBe('passthrough');
  });

  it(`should approve the plan up front with --yes and strip the flag`, () => {
    const options = resolveStartOptions(['--yes', '--clear']);

    expect(options.yes).toBe(true);
    expect(options.expoArgs).toEqual(['--clear']);
    expect(resolveStartOptions([]).yes).toBe(false);
  });

  it.each([
    ['--ios', 'ios'],
    ['-i', 'ios'],
    ['--android', 'android'],
    ['-a', 'android'],
    ['--web', 'web'],
    ['-w', 'web'],
  ])(`should read the platform from %s`, (flag, platform) => {
    expect(resolveStartOptions(['--smart', flag]).platform).toBe(platform);
  });

  it(`should keep the platform flag in the expo start passthrough`, () => {
    expect(resolveStartOptions(['--smart', '--ios']).expoArgs).toEqual(['--ios']);
  });

  it(`should use the first platform flag when several are given`, () => {
    expect(resolveStartOptions(['--android', '--ios']).platform).toBe('android');
  });

  it(`should ask for a JSON plan and strip the flag`, () => {
    expect(resolveStartOptions(['--plan', '--json'])).toEqual({
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
    expect(resolveStartOptions(['--plan']).json).toBe(false);
  });

  it(`should report no platform when none is asked for`, () => {
    expect(resolveStartOptions(['--smart', '--port', '8082']).platform).toBeUndefined();
  });

  it(`should suppress the follow-ups and strip the flag`, () => {
    expect(resolveStartOptions(['--no-followups', '--clear'])).toEqual({
      mode: 'smart',
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
    expect(resolveStartOptions([]).followups).toBe(true);
  });

  it(`should strip --no-checkpoint and skip the snapshot`, () => {
    const options = resolveStartOptions(['--no-checkpoint', '--smart']);

    expect(options.checkpoint).toBe(false);
    expect(options.expoArgs).toEqual([]);
    expect(resolveStartOptions(['--smart']).checkpoint).toBe(true);
  });
});
