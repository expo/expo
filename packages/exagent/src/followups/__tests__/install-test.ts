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

    expect(ids(followups)).toEqual(['dev']);
    expect(followups[0]!.command).toBe('npx exagent dev');
    expect(followups[0]!.why).toContain('react-native-fancy');
    expect(followups[0]!.why).toContain('development build');
  });

  it(`should warn for a bare project, whose native directories need a sync instead`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ impact: 'native-module', action: 'native-sync' })],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['dev']);
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

    expect(ids(followups)).toEqual(['reload-app']);
    expect(followups[0]!.command).toBe('npx exagent runtime:reload');
    expect(followups[0]!.why).toContain('reload');
  });

  it(`should say a reload is enough for a native module Expo Go already bundles`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ impact: 'native-module', expoGoBundled: true, action: 'reload' })],
      packagesWithSkills: [],
    });

    expect(ids(followups)).toEqual(['reload-app']);
  });

  it(`should point at the skill the installed package ships`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ packageName: '@expo/ui' })],
      packagesWithSkills: ['@expo/ui'],
    });

    expect(ids(followups)).toEqual(['reload-app', 'skills-show']);
    expect(followups[1]!.command).toBe('npx exagent skills:show @expo/ui');
  });

  it(`should list the skills when more than one package ships one`, () => {
    const followups = buildInstallFollowUps({
      reports: [report({ packageName: '@expo/ui' }), report({ packageName: 'expo-camera' })],
      packagesWithSkills: ['@expo/ui', 'expo-camera'],
    });

    expect(ids(followups)).toEqual(['reload-app', 'skills-list']);
    expect(followups[1]!.command).toBe('npx exagent skills:list');
  });

  it(`should keep the skill pointer next to the build warning`, () => {
    const followups = buildInstallFollowUps({
      reports: [
        report({ packageName: '@expo/ui', impact: 'native-module', action: 'prebuild-and-build' }),
      ],
      packagesWithSkills: ['@expo/ui'],
    });

    expect(ids(followups)).toEqual(['dev', 'skills-show']);
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
