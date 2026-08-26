/* eslint-env jest */
// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
//
// F29: `exagent install --check --json <package>` on a package the project does not have exited
// **1** with a success-shaped object — `installed: false`, `check: null`, the code buried in the
// body — and zero bytes on stderr. `--check` is the natural first move for an agent deciding
// whether to install something, so the one thing it must never do is answer a failure with an
// object that parses and says nothing.
//
// Driven through the published bin against the fixture's stub `expo`, because the property is
// about the process boundary: the exit code, what is on stdout, and what is on stderr.
import { executeExagentAsync, setupFixtureAsync } from '../utils';

/** The message the real Expo CLI prints for a package it cannot resolve, verbatim. */
const PACKAGE_NOT_FOUND =
  '"@react-native-async-storage/async-storage" is added as a dependency in your project\'s package.json but it doesn\'t seem to be installed. Run "npm install", or the equivalent for your package manager, and try again.';

describe('exagent install --check', () => {
  it(`should carry the diagnosis when the Expo CLI printed no report`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['install', '--check', '--json', '@react-native-async-storage/async-storage'],
      {
        reject: false,
        env: { STUB_EXPO_EXIT_CODE: '1', STUB_EXPO_STDERR: PACKAGE_NOT_FOUND },
      }
    );

    expect(result.exitCode).toBe(1);
    // One object, and it says what happened.
    const payload = JSON.parse(result.stdout);
    expect(payload.check.ok).toBe(false);
    expect(payload.check.report).toBeNull();
    expect(payload.check.output).toContain("doesn't seem to be installed");
    // The correction: this CLI read package.json and the package is not in it at all.
    expect(payload.check.notes.join('\n')).toContain(
      `"@react-native-async-storage/async-storage" is not in this project's package.json`
    );
    // And the failure is not silent on the stream a person reads either.
    expect(result.stderr).toContain("doesn't seem to be installed");
  });

  it(`should pass the Expo CLI's own report through for a check that ran`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['install', '--check', '--json'], {
      env: { STUB_EXPO_CHECK_JSON: '{"dependencies":[],"upToDate":true}' },
    });

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.check).toEqual({
      ok: true,
      report: { dependencies: [], upToDate: true },
      output: null,
      notes: [],
    });
    expect(payload.installed).toBe(false);
  });

  it(`should report the outdated dependencies the Expo CLI named`, async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const report = JSON.stringify({
      dependencies: [
        { packageName: 'expo-camera', packageVersion: '17.0.0', expectedVersionOrRange: '~18.0.0' },
      ],
      upToDate: false,
    });

    const result = await executeExagentAsync(
      projectRoot,
      ['install', '--check', '--json', 'expo-camera'],
      { reject: false, env: { STUB_EXPO_EXIT_CODE: '1', STUB_EXPO_CHECK_JSON: report } }
    );

    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout);
    expect(payload.check.ok).toBe(false);
    expect(payload.check.report).toEqual(JSON.parse(report));
    // Declared and installed, so there is nothing about the project to correct: the version
    // mismatch is what `--check` is for, and the CLI's own report already says it.
    expect(payload.check.notes).toEqual([]);
  });
});
