import { resolveStartOptions } from '../resolveOptions';

describe(resolveStartOptions, () => {
  it(`should forward every argument to expo start`, () => {
    expect(resolveStartOptions(['--web', '--port', '8082'])).toEqual({
      mode: 'default',
      expoArgs: ['--web', '--port', '8082'],
      agentSkills: true,
      platform: 'web',
      json: false,
    });
  });

  it(`should strip --no-agent-skills and skip the sync`, () => {
    expect(resolveStartOptions(['--no-agent-skills', '--clear'])).toEqual({
      mode: 'default',
      expoArgs: ['--clear'],
      agentSkills: false,
      platform: undefined,
      json: false,
    });
  });

  it(`should stay in default mode without a plan flag`, () => {
    expect(resolveStartOptions([]).mode).toBe('default');
  });

  it(`should enter plan mode and strip the flag`, () => {
    expect(resolveStartOptions(['--plan', '--port', '8082'])).toEqual({
      mode: 'plan',
      expoArgs: ['--port', '8082'],
      agentSkills: true,
      platform: undefined,
      json: false,
    });
  });

  it(`should enter smart mode and strip the flag`, () => {
    expect(resolveStartOptions(['--smart', '--clear'])).toEqual({
      mode: 'smart',
      expoArgs: ['--clear'],
      agentSkills: true,
      platform: undefined,
      json: false,
    });
  });

  it(`should only emit the plan when both plan flags are given`, () => {
    expect(resolveStartOptions(['--smart', '--plan']).mode).toBe('plan');
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
    });
  });

  it(`should not ask for JSON without the flag`, () => {
    expect(resolveStartOptions(['--plan']).json).toBe(false);
  });

  it(`should report no platform when none is asked for`, () => {
    expect(resolveStartOptions(['--smart', '--port', '8082']).platform).toBeUndefined();
  });
});
