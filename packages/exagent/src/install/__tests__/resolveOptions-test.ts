import { resolveInstallPlan } from '../resolveOptions';

describe(resolveInstallPlan, () => {
  it(`should forward the package specs to expo install`, () => {
    expect(resolveInstallPlan(['expo-sqlite', '@expo/ui@~1.0.0'])).toEqual({
      expoArgs: ['expo-sqlite', '@expo/ui@~1.0.0'],
      packages: ['expo-sqlite', '@expo/ui@~1.0.0'],
      agentSkills: true,
      skillContext: true,
      syncScope: 'packages',
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
    ]);

    expect(plan.expoArgs).toEqual(['expo-sqlite', '--fix']);
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

  it(`should skip the sync for --check, which installs nothing`, () => {
    expect(resolveInstallPlan(['--check']).syncScope).toBe('none');
    expect(resolveInstallPlan(['expo-sqlite', '--check']).syncScope).toBe('none');
  });
});
