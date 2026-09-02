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
      json: false,
      check: false,
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

  it(`should strip the agent-cli-only flags from the expo arguments`, () => {
    const plan = resolveInstallPlan([
      'expo-sqlite',
      '--no-agent-skills',
      '--fix',
      '--no-skill-context',
      '--no-impact',
      '--no-followups',
    ]);

    expect(plan.expoArgs).toEqual(['expo-sqlite', '--fix']);
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

  describe('--json', () => {
    it(`should own the flag rather than forward it`, () => {
      const plan = resolveInstallPlan(['expo-sqlite', '--json']);

      expect(plan.json).toBe(true);
      // `expo install` rejects `--json` without `--check`, and this command answers for itself now.
      expect(plan.expoArgs).toEqual(['expo-sqlite']);
    });

    // The `--check` report belongs to the Expo CLI, so the flag is handed on and the payload
    // travels inside this command's own object.
    it(`should forward the flag for a --check run`, () => {
      expect(resolveInstallPlan(['--check', '--json']).expoArgs).toEqual(['--check', '--json']);
    });

    it(`should keep the skill dump off stdout`, () => {
      expect(resolveInstallPlan(['expo-sqlite', '--json']).skillContext).toBe(false);
      expect(resolveInstallPlan(['expo-sqlite']).skillContext).toBe(true);
    });
  });

  // Everything a caller can get wrong is decided here, before anything is spawned: a rejected
  // invocation must not reach `expo install` and be rejected there.
  describe('arguments that cannot work', () => {
    it(`should reject a flag neither CLI has, naming both sets`, () => {
      expect(() => resolveInstallPlan(['react', '--verbose'])).toThrow(
        /"--verbose" is not an option/
      );
      expect(() => resolveInstallPlan(['react', '--no-followup'])).toThrow(/is not an option/);
    });

    it(`should point a package-manager flag at the separator that forwards it`, () => {
      expect(() => resolveInstallPlan(['react', '--verbose'])).toThrow(
        /npx @expo\/agent-cli install react -- --verbose/
      );
    });

    it(`should accept every flag either CLI has`, () => {
      const flags = [
        '--check',
        '--dev',
        '--npm',
        '--pnpm',
        '--yarn',
        '--bun',
        '--json',
        '--no-agent-skills',
        '--no-skill-context',
        '--no-impact',
        '--no-followups',
      ];
      for (const flag of flags) {
        expect(() => resolveInstallPlan([flag])).not.toThrow();
      }
      expect(() => resolveInstallPlan(['react', '--fix'])).not.toThrow();
    });

    it(`should reject --check with --fix, the way the Expo CLI does`, () => {
      expect(() => resolveInstallPlan(['--check', '--fix'])).toThrow(/cannot both apply/);
    });

    it(`should never judge what comes after the separator`, () => {
      expect(() =>
        resolveInstallPlan(['react', '--', '--verbose', '--legacy-peer-deps'])
      ).not.toThrow();
    });
  });
});
