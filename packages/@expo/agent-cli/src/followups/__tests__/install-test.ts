import type { InstallImpactReport } from '../../project/types';
import { buildInstallFollowUps } from '../install';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

function report(overrides: Partial<InstallImpactReport> = {}): InstallImpactReport {
  return {
    packageName: 'expo-sqlite',
    impact: 'js-only',
    expoGoBundled: false,
    action: 'reload',
    reasons: [],
    ...overrides,
  };
}

describe(buildInstallFollowUps, () => {
  it(`should offer nothing when nothing was classified`, () => {
    expect(buildInstallFollowUps({ reports: [], packagesWithSkills: [] })).toEqual([]);
  });

  it(`should warn that the running app cannot load a new native module`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({
          packageName: 'react-native-fancy',
          impact: 'native-module',
          action: 'prebuild-and-build',
        }),
      ],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['dev', 'typecheck']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli dev');
    expect(followups[0]!.why).toContain('react-native-fancy');
    expect(followups[0]!.why).toContain('development build');
  });

  it(`should warn for a bare project, whose native directories need a sync instead`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ impact: 'native-module', action: 'native-sync' })],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['dev', 'typecheck']);
  });

  it(`should name every package that needs a new build`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({ packageName: 'a-module', impact: 'native-module', action: 'prebuild-and-build' }),
        report({ packageName: 'b-plugin', impact: 'config-plugin', action: 'prebuild-and-build' }),
      ],
      packagesWithSkills: [],
    });

    expect(followups[0]!.why).toContain('a-module');
    expect(followups[0]!.why).toContain('b-plugin');
  });

  it(`should say a reload is enough for a JavaScript only install`, () => {
    const followups = buildInstallFollowUps({
      reports: [report()],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['reload-app', 'typecheck']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli runtime:reload');
    expect(followups[0]!.why).toContain('reload');
  });

  // F134 [live, wave 31]: `install expo-haptics` on an Expo Go project printed one object saying
  // both `impact: "native-module"` with `ships an ios/ directory` among its reasons **and** "Only
  // JavaScript changed" in the follow-up beside it [`wave31-open-cells/evidence/
  // 03-install-haptics.out`]. The rung is right and the sentence under it was not: the reason a
  // reload is enough here is that the runtime already carries the module, which is a different
  // fact from nothing native having been added — and it is the fact that stops holding the moment
  // the project builds its own runtime.
  it(`should say a reload is enough for a native module Expo Go already bundles`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({
          packageName: 'expo-haptics',
          impact: 'native-module',
          expoGoBundled: true,
          action: 'reload',
        }),
      ],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['reload-app', 'typecheck']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli runtime:reload');
    expect(followups[0]!.why).toContain('expo-haptics');
    expect(followups[0]!.why).toContain('Expo Go');
    // The claim that has to go: this package ships native code, and the report says so.
    expect(followups[0]!.why).not.toContain('Only JavaScript changed');
  });

  it(`should keep the JavaScript-only sentence for a package that ships no native code`, () => {
    const followups = buildInstallFollowUps({
      reports: [report()],
      packagesWithSkills: [],
    });

    expect(followups[0]!.why).toContain('Only JavaScript changed');
  });

  // A mixed install: one package Expo Go carries and one that ships nothing native. Neither
  // sentence is true of both, so the rung falls back to what is true of the set.
  it(`should not claim either reason when the reload covers both kinds`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({ packageName: 'plain-js' }),
        report({
          packageName: 'expo-haptics',
          impact: 'native-module',
          expoGoBundled: true,
          action: 'reload',
        }),
      ],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['reload-app', 'typecheck']);
    expect(followups[0]!.why).not.toContain('Only JavaScript changed');
    expect(followups[0]!.why).toContain('reload');
  });

  it(`should point at the skill the installed package ships`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ packageName: '@expo/ui' })],
      packagesWithSkills: ['@expo/ui'],
    });

    expect(ids(followups)).toEqual(['reload-app', 'skills-show', 'typecheck']);
    expect(followups[1]!.command).toBe('npx @expo/agent-cli skills:show @expo/ui');
  });

  it(`should list the skills when more than one package ships one`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ packageName: '@expo/ui' }), report({ packageName: 'expo-camera' })],
      packagesWithSkills: ['@expo/ui', 'expo-camera'],
    });

    expect(ids(followups)).toEqual(['reload-app', 'skills-list', 'typecheck']);
    expect(followups[1]!.command).toBe('npx @expo/agent-cli skills:list');
  });

  it(`should keep the skill pointer next to the build warning`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({ packageName: '@expo/ui', impact: 'native-module', action: 'prebuild-and-build' }),
      ],
      packagesWithSkills: ['@expo/ui'],
    });

    expect(ids(followups)).toEqual(['dev', 'skills-show', 'typecheck']);
  });

  it(`should never offer more than three follow-ups`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({ packageName: 'a', impact: 'native-module', action: 'prebuild-and-build' }),
        report({ packageName: 'b' }),
        report({ packageName: 'c' }),
        report({ packageName: 'd' }),
      ],
      packagesWithSkills: ['a', 'b', 'c'],
    });

    expect(followups.length).toBeLessThanOrEqual(3);
  });
});
