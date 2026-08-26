import { formatImpactReport } from '../format';
import { buildImpactReport } from '../impactAsync';
import { DEFAULT_PRESET } from '../resolveOptions';
import type { ImpactOptions } from '../resolveOptions';
import type { PlatformImpact, RuntimeVersionInfo } from '../types';

function options(overrides: Partial<ImpactOptions> = {}): ImpactOptions {
  return {
    platform: 'all',
    mode: 'last-build',
    buildId: null,
    base: null,
    head: null,
    profile: null,
    preset: DEFAULT_PRESET,
    assert: null,
    json: false,
    followups: false,
    ...overrides,
  };
}

function platform(overrides: Partial<PlatformImpact> = {}): PlatformImpact {
  return {
    platform: 'ios',
    class: 'needs-native-build',
    fingerprintChanged: true,
    baseHash: 'aaaaaaaaaaaaaaaaaaaa',
    headHash: 'bbbbbbbbbbbbbbbbbbbb',
    changedSources: [
      {
        op: 'added',
        type: 'dir',
        path: 'node_modules/react-native-mmkv',
        reasons: ['rncoreAutolinkingIos'],
        kind: 'native-module',
        class: 'needs-native-build',
      },
    ],
    reasons: ['the autolinked native modules changed'],
    cachedBuild: null,
    caveats: [],
    ...overrides,
  };
}

const runtimeVersion: RuntimeVersionInfo = {
  policy: 'appVersion',
  literal: null,
  source: 'app.json',
};

function render(overrides: Partial<Parameters<typeof buildImpactReport>[0]> = {}): string {
  return formatImpactReport(
    buildImpactReport({
      projectRoot: '/project',
      options: options(),
      platforms: [platform()],
      fileClass: null,
      changedFilesKnown: true,
      runtimeVersion,
      ...overrides,
    })
  );
}

describe(formatImpactReport, () => {
  it(`should lead with the class and what it means`, () => {
    expect(render()).toMatch(/^impact\s+needs-native-build — the app has to be built again/);
  });

  it(`should name the preset both sides were computed under`, () => {
    expect(render()).toContain(`preset      ${DEFAULT_PRESET}`);
  });

  it(`should name both sides of the comparison with short hashes`, () => {
    const output = render();

    expect(output).toContain('last build recorded by exagent aaaaaaaaaaaa');
    expect(output).toContain('working tree bbbbbbbbbbbb');
  });

  it(`should list the changed sources with their kind`, () => {
    expect(render()).toContain('added   node_modules/react-native-mmkv [native-module]');
  });

  it(`should count the sources it did not list`, () => {
    const many = Array.from({ length: 8 }, (_value, index) => ({
      op: 'added' as const,
      type: 'dir',
      path: `node_modules/pkg-${index}`,
      reasons: ['expoAutolinkingIos'],
      kind: 'native-module' as const,
      class: 'needs-native-build' as const,
    }));

    expect(render({ platforms: [platform({ changedSources: many })] })).toContain(
      '… and 3 more, in --json'
    );
  });

  it(`should report the ota verdict apart from the class, with its policy`, () => {
    const output = render();

    expect(output).toContain('not safe · policy appVersion');
    expect(output).toContain('(app.json)');
  });

  it(`should report an unresolved runtimeVersion as unknown, not as unsafe`, () => {
    const output = render({ runtimeVersion: { policy: null, literal: null, source: null } });

    expect(output).toContain('unknown · runtimeVersion unresolved');
    expect(output).not.toContain('not safe');
  });

  it(`should report a fingerprint that could not be decided as unknown`, () => {
    expect(render({ platforms: [platform({ fingerprintChanged: null })] })).toContain(
      'fingerprint unknown'
    );
  });

  it(`should report a cached build as the better answer`, () => {
    const output = render({
      platforms: [
        platform({
          cachedBuild: {
            id: 'build-1',
            status: 'FINISHED',
            platform: 'IOS',
            buildProfile: 'development',
            createdAt: '2026-08-24T00:00:00Z',
            buildUrl: null,
          },
        }),
      ],
    });

    expect(output).toContain('build-1 (FINISHED, 2026-08-24T00:00:00Z) already matches');
  });

  it(`should report a passing assertion`, () => {
    expect(render({ options: options({ assert: 'needs-native-build' }) })).toContain(
      'needs-native-build — the real class is at most that'
    );
  });

  it(`should report a failing assertion with the real class`, () => {
    expect(render({ options: options({ assert: 'js-only' }) })).toContain(
      'js-only — the real class is needs-native-build, which is stronger'
    );
  });

  it(`should print the caveats, so the limits are read and not only documented`, () => {
    expect(render()).toContain('What this cannot establish exactly:');
  });
});
