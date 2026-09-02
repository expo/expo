import { resolveStartOptions } from '../resolveOptions';

describe(resolveStartOptions, () => {
  it(`should forward every argument to expo start`, () => {
    expect(resolveStartOptions(['--web', '--port', '8082'])).toEqual({
      expoArgs: ['--web', '--port', '8082'],
      agentSkills: true,
      platform: 'web',
      followups: true,
    });
  });

  it(`should strip --no-agent-skills and skip the sync`, () => {
    expect(resolveStartOptions(['--no-agent-skills', '--clear'])).toEqual({
      expoArgs: ['--clear'],
      agentSkills: false,
      platform: undefined,
      followups: true,
    });
  });

  it(`should suppress the follow-ups and strip the flag`, () => {
    expect(resolveStartOptions(['--no-followups', '--clear'])).toEqual({
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      followups: false,
    });
  });

  it(`should keep the follow-ups without the flag`, () => {
    expect(resolveStartOptions([]).followups).toBe(true);
  });

  it(`should forward the arguments after -- to expo start`, () => {
    // The separator itself reaches `expo start` too, so a command line that ends there behaves
    // exactly as it does when `expo start` is run directly.
    expect(resolveStartOptions(['--', '--web']).expoArgs).toEqual(['--', '--web']);
  });

  // The flags of the plan engine moved to `@expo/agent-cli dev`, and this command shares its name with an
  // `expo` command, so it forwards them instead of acting on them: `expo start` is the one that
  // decides whether an argument is its own (llp/0006 §The `@expo/agent-cli` launcher).
  it.each(['--plan', '--smart', '--passthrough', '--yes', '--json'])(
    `should forward %s to expo start instead of handling it`,
    (flag) => {
      expect(resolveStartOptions([flag]).expoArgs).toEqual([flag]);
    }
  );

  it.each([
    ['--ios', 'ios'],
    ['-i', 'ios'],
    ['--android', 'android'],
    ['-a', 'android'],
    ['--web', 'web'],
    ['-w', 'web'],
  ])(`should read the platform from %s`, (flag, platform) => {
    expect(resolveStartOptions([flag]).platform).toBe(platform);
  });

  it(`should keep the platform flag in the expo start passthrough`, () => {
    expect(resolveStartOptions(['--ios']).expoArgs).toEqual(['--ios']);
  });

  it(`should use the first platform flag when several are given`, () => {
    expect(resolveStartOptions(['--android', '--ios']).platform).toBe('android');
  });

  it(`should report no platform when none is asked for`, () => {
    expect(resolveStartOptions(['--port', '8082']).platform).toBeUndefined();
  });
});
