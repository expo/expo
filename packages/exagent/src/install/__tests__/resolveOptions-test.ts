import { resolveInstallPlan } from '../resolveOptions';

describe(resolveInstallPlan, () => {
  it(`should forward the package specs to expo install`, () => {
    expect(resolveInstallPlan(['expo-sqlite', '@expo/ui@~1.0.0'])).toEqual({
      expoArgs: ['expo-sqlite', '@expo/ui@~1.0.0'],
      packages: ['expo-sqlite', '@expo/ui@~1.0.0'],
      agentSkills: true,
      skillContext: true,
      syncScope: 'packages',
      impact: true,
      followups: true,
      checkpoint: true,
    });
  });

  it(`should keep the expo install flags in place`, () => {
    const plan = resolveInstallPlan(['expo-sqlite', '--dev', '--pnpm', '--', '--verbose']);

    expect(plan.expoArgs).toEqual(['expo-sqlite', '--dev', '--pnpm', '--', '--verbose']);
    expect(plan.packages).toEqual(['expo-sqlite']);
  });

  it(`should not treat arguments after -- as packages`, () => {
    expect(resolveInstallPlan(['expo-sqlite', '--', 'react']).packages).toEqual(['expo-sqlite']);
  });

  it(`should strip the exagent-only flags from the expo arguments`, () => {
    const plan = resolveInstallPlan([
      'expo-sqlite',
      '--no-agent-skills',
      '--fix',
      '--no-skill-context',
      '--no-impact',
      '--no-followups',
      '--no-checkpoint',
    ]);

    expect(plan.expoArgs).toEqual(['expo-sqlite', '--fix']);
  });

  it(`should skip the checkpoint with --no-checkpoint, and for an install that changes nothing`, () => {
    expect(resolveInstallPlan(['expo-sqlite']).checkpoint).toBe(true);
    expect(resolveInstallPlan(['expo-sqlite', '--no-checkpoint']).checkpoint).toBe(false);
    expect(resolveInstallPlan(['--check']).checkpoint).toBe(false);
  });

  it(`should classify the impact of the named packages by default`, () => {
    expect(resolveInstallPlan(['expo-sqlite']).impact).toBe(true);
    // The skill flags and the impact report are independent decisions.
    expect(resolveInstallPlan(['expo-sqlite', '--no-agent-skills']).impact).toBe(true);
  });

  it(`should skip the impact report with --no-impact`, () => {
    expect(resolveInstallPlan(['expo-sqlite', '--no-impact']).impact).toBe(false);
  });

  it(`should skip the impact report when no package is named or nothing is installed`, () => {
    expect(resolveInstallPlan(['--fix']).impact).toBe(false);
    expect(resolveInstallPlan([]).impact).toBe(false);
    expect(resolveInstallPlan(['expo-sqlite', '--check']).impact).toBe(false);
  });

  it(`should skip the sync with --no-agent-skills`, () => {
    const plan = resolveInstallPlan(['expo-sqlite', '--no-agent-skills']);

    expect(plan.agentSkills).toBe(false);
    expect(plan.syncScope).toBe('none');
  });

  it(`should skip only the context dump with --no-skill-context`, () => {
    const plan = resolveInstallPlan(['expo-sqlite', '--no-skill-context']);

    expect(plan.agentSkills).toBe(true);
    expect(plan.skillContext).toBe(false);
    expect(plan.syncScope).toBe('packages');
  });

  it(`should sync every package when no package is named`, () => {
    expect(resolveInstallPlan(['--fix']).syncScope).toBe('all');
    expect(resolveInstallPlan([]).syncScope).toBe('all');
  });

  it(`should suppress the follow-ups with --no-followups`, () => {
    expect(resolveInstallPlan(['expo-sqlite']).followups).toBe(true);
    expect(resolveInstallPlan(['expo-sqlite', '--no-followups']).followups).toBe(false);
  });

  it(`should skip the sync for --check, which installs nothing`, () => {
    expect(resolveInstallPlan(['--check']).syncScope).toBe('none');
    expect(resolveInstallPlan(['expo-sqlite', '--check']).syncScope).toBe('none');
  });
});
