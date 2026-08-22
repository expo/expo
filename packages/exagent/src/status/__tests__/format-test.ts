import { stripVTControlCharacters } from 'node:util';

import { formatStatusReport } from '../format';
import type { StatusReport } from '../types';

/** The report without color, so assertions never depend on the terminal's color support. */
function report(value: StatusReport): string {
  return stripVTControlCharacters(formatStatusReport(value));
}

function mockReport(overrides: Partial<StatusReport> = {}): StatusReport {
  return {
    project: {
      root: '/project',
      name: 'my-app',
      sdkVersion: '54.0.0',
      native: 'cng',
      nativeDirs: { ios: false, android: false },
      usesDevClient: false,
      hasWeb: true,
    },
    expoGo: { compatible: true, reasonCount: 0 },
    freshness: {
      hash: 'abcdef0123456789',
      platforms: [
        { platform: 'ios', state: 'stale', detail: 'no recorded build', recordedHash: null },
        {
          platform: 'android',
          state: 'fresh',
          detail: 'matches abcdef01',
          recordedHash: 'abcdef0123456789',
        },
      ],
    },
    devServer: { url: 'http://127.0.0.1:8081', running: true, appsConnected: 1 },
    skills: { agentIds: ['claude-code'], discovered: 3, linked: 3 },
    next: {
      command: 'exagent dev',
      rule: 'expo-go',
      target: 'expo-go',
      steps: [
        {
          id: 'start',
          argv: ['expo', 'start', '--go'],
          reason: 'Opens the project in Expo Go.',
          timeClass: 'seconds',
        },
      ],
    },
    errors: {},
    ...overrides,
  };
}

/** The line of the report that starts with a label. */
function line(value: StatusReport, label: string): string {
  const found = report(value)
    .split('\n')
    .find((text) => text.startsWith(label));
  if (found == null) {
    throw new Error(`No "${label}" line in:\n${report(value)}`);
  }
  return found;
}

describe(formatStatusReport, () => {
  it(`should print one line per section, like git status`, () => {
    const lines = report(mockReport()).split('\n');

    expect(lines).toHaveLength(6);
    expect(lines.map((text) => text.split(/\s{2,}/)[0])).toEqual([
      'project',
      'expo go',
      'freshness',
      'dev server',
      'skills',
      'next',
    ]);
  });

  it(`should summarize a managed project on the project line`, () => {
    expect(line(mockReport(), 'project')).toContain('my-app');
    expect(line(mockReport(), 'project')).toContain('SDK 54.0.0');
    expect(line(mockReport(), 'project')).toContain('CNG');
    expect(line(mockReport(), 'project')).toContain('no dev client');
    expect(line(mockReport(), 'project')).toContain('web');
  });

  it(`should name the checked-in native directories of a bare project`, () => {
    const report = mockReport({
      project: {
        ...mockReport().project!,
        native: 'bare',
        nativeDirs: { ios: true, android: true },
        usesDevClient: true,
        hasWeb: false,
      },
    });

    expect(line(report, 'project')).toContain('bare (ios, android)');
    expect(line(report, 'project')).toContain('dev client');
    expect(line(report, 'project')).toContain('no web');
  });

  it(`should print an unknown SDK version instead of nothing`, () => {
    const report = mockReport({ project: { ...mockReport().project!, sdkVersion: null } });

    expect(line(report, 'project')).toContain('SDK unknown');
  });

  it(`should print the Expo Go verdict with the number of reasons`, () => {
    expect(line(mockReport(), 'expo go')).toContain('compatible');

    const report = mockReport({ expoGo: { compatible: false, reasonCount: 2 } });
    expect(line(report, 'expo go')).toContain('not compatible (2 reasons)');
  });

  it(`should print a single Expo Go reason in the singular`, () => {
    const report = mockReport({ expoGo: { compatible: false, reasonCount: 1 } });

    expect(line(report, 'expo go')).toContain('(1 reason)');
  });

  it(`should print the freshness of every platform with its detail`, () => {
    expect(line(mockReport(), 'freshness')).toContain('ios: stale (no recorded build)');
    expect(line(mockReport(), 'freshness')).toContain('android: fresh (matches abcdef01)');
  });

  it(`should print the fingerprint error on the freshness line`, () => {
    const report = mockReport({
      freshness: {
        hash: null,
        error: 'fingerprint CLI not found\nInstall @expo/fingerprint',
        platforms: [
          { platform: 'ios', state: 'unknown', detail: 'no fingerprint tool', recordedHash: null },
          {
            platform: 'android',
            state: 'unknown',
            detail: 'no fingerprint tool',
            recordedHash: null,
          },
        ],
      },
    });

    expect(line(report, 'freshness')).toContain('unknown');
    expect(line(report, 'freshness')).toContain('fingerprint CLI not found');
    // The line stays one line, even for a multi-line error.
    expect(line(report, 'freshness')).not.toContain('Install @expo/fingerprint');
  });

  it(`should keep a long fingerprint error on one line`, () => {
    const error = `The @expo/fingerprint CLI is not installed in this project, so the native surface cannot be hashed. Install it with "npx expo install @expo/fingerprint".`;
    const report = mockReport({
      freshness: {
        hash: null,
        error,
        platforms: [
          { platform: 'ios', state: 'unknown', detail: 'no fingerprint tool', recordedHash: null },
        ],
      },
    });

    expect(line(report, 'freshness')).toContain('The @expo/fingerprint CLI is not installed');
    expect(line(report, 'freshness')).toContain('…');
    // The full message is in the `--json` report, and in `exagent context`.
    expect(line(report, 'freshness')).not.toContain('npx expo install');
  });

  it(`should print the dev server and the number of connected apps`, () => {
    expect(line(mockReport(), 'dev server')).toBe(
      'dev server  running on http://127.0.0.1:8081 · 1 app connected'
    );
  });

  it(`should print connected apps in the plural`, () => {
    const report = mockReport({
      devServer: { url: 'http://127.0.0.1:8081', running: true, appsConnected: 0 },
    });

    expect(line(report, 'dev server')).toContain('0 apps connected');
  });

  it(`should print a dev server that is not running with the url it probed`, () => {
    const report = mockReport({
      devServer: {
        url: 'http://127.0.0.1:8081',
        running: false,
        appsConnected: 0,
        reason: 'fetch failed',
      },
    });

    expect(line(report, 'dev server')).toContain('not running');
    expect(line(report, 'dev server')).toContain('http://127.0.0.1:8081');
  });

  it(`should print the linked skill count of the selected agents`, () => {
    expect(line(mockReport(), 'skills')).toBe('skills      claude-code · 3/3 linked');
  });

  it(`should print an out-of-sync skill count as it is`, () => {
    const report = mockReport({ skills: { agentIds: ['claude-code'], discovered: 3, linked: 1 } });

    expect(line(report, 'skills')).toContain('1/3 linked');
  });

  it(`should print that no agent is selected`, () => {
    const report = mockReport({ skills: { agentIds: null, discovered: 2, linked: 0 } });

    expect(line(report, 'skills')).toContain('no agent selected');
    expect(line(report, 'skills')).toContain('2 skills discovered');
  });

  it(`should print that the project ships no skills`, () => {
    const report = mockReport({ skills: { agentIds: ['claude-code'], discovered: 0, linked: 0 } });

    expect(line(report, 'skills')).toContain('no skills discovered');
  });

  it(`should print the next action as the rule and the first step`, () => {
    expect(line(mockReport(), 'next')).toBe('next        exagent dev → expo-go: expo start --go');
  });

  it(`should count the steps that follow the first one`, () => {
    const report = mockReport({
      next: {
        command: 'exagent dev',
        rule: 'dev-client-stale',
        target: 'dev-client',
        steps: [
          {
            id: 'prebuild',
            argv: ['expo', 'prebuild', '--platform', 'ios'],
            reason: 'Generates the ios native project.',
            timeClass: 'a-minute',
          },
          {
            id: 'run',
            argv: ['expo', 'run:ios'],
            reason: 'Builds the ios app.',
            timeClass: 'many-minutes',
          },
        ],
      },
    });

    expect(line(report, 'next')).toContain('dev-client-stale: expo prebuild --platform ios');
    expect(line(report, 'next')).toContain('+1 more step');
  });

  it(`should note the section that could not be read and keep the others`, () => {
    const report = mockReport({
      skills: null,
      errors: { skills: 'autolinking is not installed' },
    });

    expect(line(report, 'skills')).toContain('unavailable');
    expect(line(report, 'skills')).toContain('autolinking is not installed');
    // A broken section never hides the rest of the report.
    expect(line(report, 'project')).toContain('my-app');
  });

  it(`should note a missing section even without an error message`, () => {
    const report = mockReport({ devServer: null });

    expect(line(report, 'dev server')).toContain('unavailable');
  });
});
