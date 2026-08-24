/* eslint-env jest */
// @ref llp/0011-build-explain.rfc.md §Two layers of phase detection
// The two layers are asserted separately, because they fail differently: layer 1 reads a format
// EAS owns and can change, and layer 2 reads what the tools print, which is what makes a local
// `expo run:ios` log segment like a cloud one.

import {
  detectPhases,
  markPhaseStatuses,
  phaseAllowedOnPlatform,
  phaseAnchorFor,
  phaseIndexForLine,
  stripHeaderDecoration,
} from '../phases';

describe('layer 1 — the EAS phase header', () => {
  it.each([
    ['Install dependencies', 'install-dependencies'],
    ['Prebuild', 'prebuild'],
    ['Run expo prebuild', 'prebuild'],
    ['Install pods', 'pod-install'],
    ['Bundle JavaScript', 'bundle-js'],
    ['Run gradlew', 'gradle'],
    ['Run fastlane', 'fastlane'],
    ['Upload application archive', 'upload'],
  ])('reads %p as %p', (line, phase) => {
    expect(phaseAnchorFor(line)).toEqual({ phase, layer: 1 });
  });

  it.each([
    '[2026-08-23T10:00:00.000Z] Install pods',
    '2026-08-23 10:00:00 Install pods',
    '[stderr] Install pods',
    '=== Install pods ===',
    '--- Install pods ---',
    '▸ Install pods',
    '[Install pods]',
    '### Install pods',
  ])('reads a header through the decoration a transport wrapped it in: %p', (line) => {
    expect(phaseAnchorFor(line)).toEqual({ phase: 'pod-install', layer: 1 });
  });

  it('does not read a header out of a line that only mentions one', () => {
    // The decoration matcher is loose on purpose, so the words have to be the whole line.
    expect(phaseAnchorFor('Failed to install pods for this project')).toBeNull();
    expect(phaseAnchorFor('We will now run fastlane gym for you')).toBeNull();
  });

  it('strips only what a transport adds', () => {
    expect(stripHeaderDecoration('[stderr] Install pods')).toBe('Install pods');
    expect(stripHeaderDecoration('Analyzing dependencies')).toBe('Analyzing dependencies');
    expect(stripHeaderDecoration('')).toBe('');
  });
});

describe('layer 2 — what the tools print', () => {
  it.each([
    ['npm install --no-audit', 'install-dependencies'],
    ['added 1247 packages in 41s', 'install-dependencies'],
    ['npm error code E404', 'install-dependencies'],
    ['> npx expo prebuild --platform ios', 'prebuild'],
    ['PluginError: Failed to resolve plugin for module "x"', 'prebuild'],
    ['Analyzing dependencies', 'pod-install'],
    ['Using Expo modules', 'pod-install'],
    ['[Expo] Enabling modular headers for pod ExpoModulesCore', 'pod-install'],
    ['[!] Unable to find a specification for `X`', 'pod-install'],
    ['Starting Metro Bundler', 'bundle-js'],
    ['iOS Bundling failed 448ms node_modules/expo-router/entry.js', 'bundle-js'],
    ['> Task :app:compileReleaseKotlin', 'gradle'],
    ['Starting a Gradle Daemon (subsequent builds will be faster)', 'gradle'],
    ['Command line invocation:', 'xcodebuild'],
    ['note: Building targets in dependency order', 'xcodebuild'],
    ['[08:41:12]: Driving the lane \'ios build\' 🚀', 'fastlane'],
  ])('reads %p as %p', (line, phase) => {
    expect(phaseAnchorFor(line)).toEqual({ phase, layer: 2 });
  });

  it('claims nothing for a line no tool owns', () => {
    expect(phaseAnchorFor('    cd /Users/expo/workingdir/build/ios')).toBeNull();
    expect(phaseAnchorFor('')).toBeNull();
  });
});

describe('detectPhases', () => {
  it('covers every line exactly once, in order', () => {
    const lines = [
      'Cloning the project',
      'npm install',
      'added 1200 packages',
      'Analyzing dependencies',
      'Generating Pods project',
      'Command line invocation:',
      '** BUILD FAILED **',
    ];
    const phases = detectPhases(lines);

    expect(phases).toEqual([
      { name: 'unknown', status: 'unknown', startLine: 1, endLine: 1 },
      { name: 'install-dependencies', status: 'unknown', startLine: 2, endLine: 3 },
      { name: 'pod-install', status: 'unknown', startLine: 4, endLine: 5 },
      { name: 'xcodebuild', status: 'unknown', startLine: 6, endLine: 7 },
    ]);
    expect(phases[phases.length - 1]!.endLine).toBe(lines.length);
  });

  it('does not open a new segment for the phase already running', () => {
    // A Gradle run prints hundreds of `> Task :` lines, and a hundred one-line phases would be a
    // worse answer than one.
    const lines = Array.from({ length: 50 }, (_unused, index) => `> Task :app:step${index}`);
    expect(detectPhases(lines)).toEqual([
      { name: 'gradle', status: 'unknown', startLine: 1, endLine: 50 },
    ]);
  });

  it('starts in unknown, so a log that begins mid-stream still segments', () => {
    const lines = ['    at some frame', 'noise', 'Analyzing dependencies', 'more'];
    expect(detectPhases(lines).map((phase) => phase.name)).toEqual(['unknown', 'pod-install']);
  });

  it('has nothing to say about an empty log', () => {
    expect(detectPhases([])).toEqual([]);
  });

  it('rules out the other platform’s phases when the caller names one', () => {
    const lines = ['Analyzing dependencies', '> Task :app:compileReleaseKotlin'];

    expect(detectPhases(lines, 'android').map((phase) => phase.name)).toEqual(['unknown', 'gradle']);
    expect(detectPhases(lines, 'ios').map((phase) => phase.name)).toEqual(['pod-install']);
  });
});

describe('phaseAllowedOnPlatform', () => {
  it('allows everything when no platform was named', () => {
    expect(phaseAllowedOnPlatform('gradle', null)).toBe(true);
    expect(phaseAllowedOnPlatform('xcodebuild', null)).toBe(true);
  });

  it('rules out the other platform only, never the shared phases', () => {
    expect(phaseAllowedOnPlatform('gradle', 'ios')).toBe(false);
    expect(phaseAllowedOnPlatform('pod-install', 'android')).toBe(false);
    for (const shared of ['install-dependencies', 'prebuild', 'bundle-js', 'unknown'] as const) {
      expect(phaseAllowedOnPlatform(shared, 'ios')).toBe(true);
      expect(phaseAllowedOnPlatform(shared, 'android')).toBe(true);
    }
  });
});

describe('markPhaseStatuses', () => {
  const phases = [
    { name: 'install-dependencies' as const, status: 'unknown' as const, startLine: 1, endLine: 10 },
    { name: 'pod-install' as const, status: 'unknown' as const, startLine: 11, endLine: 20 },
    { name: 'xcodebuild' as const, status: 'unknown' as const, startLine: 21, endLine: 30 },
  ];

  it('marks the failing phase, and only the phases before it as succeeded', () => {
    expect(markPhaseStatuses(phases, 1).map((phase) => phase.status)).toEqual([
      'succeeded',
      'failed',
      'unknown',
    ]);
  });

  it('leaves the last phase unknown when nothing failed, because a log can be cut off', () => {
    expect(markPhaseStatuses(phases, -1).map((phase) => phase.status)).toEqual([
      'succeeded',
      'succeeded',
      'unknown',
    ]);
  });

  it('does not modify its input', () => {
    markPhaseStatuses(phases, 0);
    expect(phases.every((phase) => phase.status === 'unknown')).toBe(true);
  });
});

describe('phaseIndexForLine', () => {
  const phases = [
    { name: 'prebuild' as const, status: 'unknown' as const, startLine: 1, endLine: 5 },
    { name: 'gradle' as const, status: 'unknown' as const, startLine: 6, endLine: 9 },
  ];

  it.each([
    [1, 0],
    [5, 0],
    [6, 1],
    [9, 1],
    [10, -1],
  ])('puts line %p in phase %p', (line, index) => {
    expect(phaseIndexForLine(phases, line)).toBe(index);
  });
});
