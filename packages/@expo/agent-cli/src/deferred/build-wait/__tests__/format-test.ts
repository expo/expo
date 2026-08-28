// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { stripVTControlCharacters } from 'node:util';

import { formatBuildWaitReport, formatDuration } from '../format';
import type { BuildWaitReport } from '../types';

/** The report without color, so assertions never depend on the terminal's color support. */
function lines(report: BuildWaitReport, options?: { interrupted?: boolean }): string {
  return stripVTControlCharacters(formatBuildWaitReport(report, options));
}

function mockReport(overrides: Partial<BuildWaitReport> = {}): BuildWaitReport {
  return {
    kind: 'build',
    id: 'build-1',
    outcome: 'finished',
    status: 'FINISHED',
    platform: 'IOS',
    buildProfile: 'production',
    waitedMs: 743_000,
    polls: 74,
    build: {
      error: null,
      artifacts: null,
      fingerprint: null,
      metrics: null,
      createdAt: null,
      completedAt: null,
      appVersion: null,
      appBuildVersion: null,
    },
    followups: [],
    ...overrides,
  };
}

describe(formatBuildWaitReport, () => {
  it(`prints one fact per line, labelled`, () => {
    const output = lines(mockReport());

    expect(output).toContain('build       build-1');
    expect(output).toContain('status      FINISHED');
    expect(output).toContain('platform    ios');
    expect(output).toContain('profile     production');
    expect(output).toContain('waited      12m 23s · 74 polls');
  });

  it(`says what each outcome means for the caller`, () => {
    expect(lines(mockReport({ outcome: 'finished' }))).toContain('finished — the build succeeded');
    expect(lines(mockReport({ outcome: 'errored' }))).toContain('errored — the build failed');
    expect(lines(mockReport({ outcome: 'canceled' }))).toContain('was stopped before it finished');
  });

  // A timeout is inconclusive, and saying so is the reason it has an exit code of its own.
  it(`says a timeout is not a failure`, () => {
    expect(lines(mockReport({ outcome: 'timeout' }))).toContain('may still succeed');
  });

  // Both end as `canceled` with the same exit code, but only one means the build is still running.
  it(`tells an interrupted wait apart from a canceled build`, () => {
    expect(lines(mockReport({ outcome: 'canceled' }), { interrupted: true })).toContain(
      'this wait was interrupted; the build may still be running'
    );
  });

  it(`names the kind of thing it waited for`, () => {
    expect(lines(mockReport({ kind: 'submission' }))).toContain('submission  build-1');
  });

  it(`prints the artifact, the logs and the fingerprint when the build has them`, () => {
    const output = lines(
      mockReport({
        build: {
          ...mockReport().build,
          artifacts: {
            buildUrl: 'https://expo.dev/builds/1',
            applicationArchiveUrl: 'https://expo.dev/artifacts/1.ipa',
            buildArtifactsUrl: null,
            xcodeBuildLogsUrl: 'https://expo.dev/artifacts/logs.txt',
          },
          fingerprint: { hash: 'a1b2c3' },
          // The metrics of a real build, verbatim [observed — 2026-08-26, staging build
          // 77e676e2…]. They are **milliseconds**, which the three add up to prove: 5464 + 611690
          // + 120280 = 737434 ms, and that build ran 12m 17s by its own createdAt/completedAt.
          metrics: { buildWaitTime: 5464, buildQueueTime: 611690, buildDuration: 120280 },
        },
      })
    );

    expect(output).toContain('artifact    https://expo.dev/artifacts/1.ipa');
    expect(output).toContain('xcode logs  https://expo.dev/artifacts/logs.txt');
    expect(output).toContain('fingerprint a1b2c3');
    expect(output).toContain('timings     queued 10m 12s · waited 5s · built 2m');
  });

  it(`falls back to the build page when there is no archive`, () => {
    const output = lines(
      mockReport({
        build: {
          ...mockReport().build,
          artifacts: {
            buildUrl: 'https://expo.dev/builds/1',
            applicationArchiveUrl: null,
            buildArtifactsUrl: null,
            xcodeBuildLogsUrl: null,
          },
        },
      })
    );

    expect(output).toContain('artifact    https://expo.dev/builds/1');
  });

  it(`prints what EAS recorded about a failure`, () => {
    const output = lines(
      mockReport({
        outcome: 'errored',
        status: 'ERRORED',
        build: {
          ...mockReport().build,
          error: {
            errorCode: 'EAS_BUILD_UNKNOWN_FAIL',
            message: 'Gradle build failed with unknown error',
            docsUrl: null,
          },
        },
      })
    );

    expect(output).toContain('error       EAS_BUILD_UNKNOWN_FAIL: Gradle build failed');
  });

  it(`truncates a message that would take the line over`, () => {
    const output = lines(
      mockReport({
        build: {
          ...mockReport().build,
          error: { errorCode: null, message: 'x'.repeat(400), docsUrl: null },
        },
      })
    );

    expect(output).toContain('…');
    expect(output.split('\n').every((line) => line.length < 200)).toBe(true);
  });

  it(`leaves out the lines the payload has nothing for`, () => {
    const output = lines(mockReport({ platform: null, buildProfile: null }));

    expect(output).not.toContain('platform');
    expect(output).not.toContain('profile');
    expect(output).not.toContain('artifact');
    expect(output).not.toContain('error');
  });

  it(`says so rather than inventing a status it never saw`, () => {
    expect(lines(mockReport({ status: null }))).toContain('status      unknown');
  });
});

describe(formatDuration, () => {
  it(`spells a duration the way a person says one`, () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(999)).toBe('1s');
    expect(formatDuration(45_000)).toBe('45s');
    expect(formatDuration(60_000)).toBe('1m');
    expect(formatDuration(743_000)).toBe('12m 23s');
    expect(formatDuration(3_600_000)).toBe('1h');
    expect(formatDuration(3_840_000)).toBe('1h 4m');
  });

  it(`never spells a negative duration`, () => {
    expect(formatDuration(-5_000)).toBe('0s');
  });
});
