import { resolveStartPlan } from '../resolveOptions';

describe(resolveStartPlan, () => {
  it(`should forward every argument to expo start`, () => {
    expect(resolveStartPlan(['--web', '--port', '8082'])).toEqual({
      expoArgs: ['--web', '--port', '8082'],
      agentSkills: true,
    });
  });

  it(`should strip --no-agent-skills and skip the sync`, () => {
    expect(resolveStartPlan(['--no-agent-skills', '--clear'])).toEqual({
      expoArgs: ['--clear'],
      agentSkills: false,
    });
  });
});
