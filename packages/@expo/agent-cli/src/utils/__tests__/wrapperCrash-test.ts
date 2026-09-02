import {
  checkBinaryCommand,
  looksLikeRunnerNoise,
  looksLikeWrapperCrash,
  runnerNoiseReason,
  wrapperCrashDetail,
} from '../wrapperCrash';

/** The backtrace the machine's `.tuft-bin/eas` shim printed in the friction run of 2026-08-23. */
const RUST_BACKTRACE = `
Caused by:
    No such file or directory (os error 2)

Stack backtrace:
   0: <std::backtrace::Backtrace>::create
   1: core::ops::function::FnOnce::call_once
   2: tuft::main
`;

/** What the EAS CLI itself prints when nobody is signed in [observed — SessionManager.js]. */
const EAS_AUTH_FAILURE = `
    Either log in with "eas login" or set the EXPO_TOKEN environment variable
    if you're using EAS CLI on CI (https://docs.expo.dev/build/setting-up-ci/)
`;

describe(looksLikeWrapperCrash, () => {
  it('recognises a wrapper that panicked with a backtrace', () => {
    expect(
      looksLikeWrapperCrash({ tool: 'eas', exitCode: 1, stdout: '', stderr: RUST_BACKTRACE })
    ).toBe(true);
  });

  it('recognises a binary the shell could not run', () => {
    expect(looksLikeWrapperCrash({ tool: 'eas', exitCode: 127, stdout: '', stderr: '' })).toBe(
      true
    );
    expect(looksLikeWrapperCrash({ tool: 'expo', exitCode: 101, stdout: '', stderr: '' })).toBe(
      true
    );
  });

  // The half that keeps a real failure's output on screen: a real CLI names itself.
  it('leaves a real EAS failure alone, whatever its exit code', () => {
    expect(
      looksLikeWrapperCrash({ tool: 'eas', exitCode: 1, stdout: '', stderr: EAS_AUTH_FAILURE })
    ).toBe(false);
    expect(
      looksLikeWrapperCrash({ tool: 'eas', exitCode: 127, stdout: '', stderr: EAS_AUTH_FAILURE })
    ).toBe(false);
  });

  it('leaves a real Expo failure alone', () => {
    expect(
      looksLikeWrapperCrash({
        tool: 'expo',
        exitCode: 1,
        stdout: '',
        stderr: `CommandError: Input is required, but 'npx expo' is in non-interactive mode.`,
      })
    ).toBe(false);
  });

  // An ordinary non-zero exit with ordinary output is a failure, not a crash: without a panic
  // signature and without one of the shell's own codes, nothing says the binary was wrong.
  it('does not claim a crash for a quiet ordinary failure', () => {
    expect(
      looksLikeWrapperCrash({ tool: 'eas', exitCode: 1, stdout: '', stderr: 'Build not found\n' })
    ).toBe(false);
  });

  it('is never a crash for a clean exit or a spawn that never happened', () => {
    expect(looksLikeWrapperCrash({ tool: 'eas', exitCode: 0, stdout: '', stderr: '' })).toBe(false);
    expect(
      looksLikeWrapperCrash({ tool: 'eas', exitCode: null, stdout: '', stderr: RUST_BACKTRACE })
    ).toBe(false);
  });
});

describe(wrapperCrashDetail, () => {
  it('names the file that ran, not the package that was meant to', () => {
    const detail = wrapperCrashDetail({ tool: 'eas', exitCode: 1 }, '/home/me/.tuft-bin/eas');

    expect(detail).toContain('The eas at /home/me/.tuft-bin/eas failed to run at all');
    expect(detail).toContain('this may not be the real CLI');
    expect(detail).not.toContain('What the tool printed');
  });
});

describe(checkBinaryCommand, () => {
  it('names the binary that actually ran', () => {
    expect(checkBinaryCommand('/usr/local/bin/eas', ['whoami'])).toBe('/usr/local/bin/eas whoami');
  });

  it('quotes a path that would not survive a paste', () => {
    expect(checkBinaryCommand('/My Tools/eas', ['whoami'])).toBe('"/My Tools/eas" whoami');
  });
});

// F93 — @ref src/utils/runnerLock.ts. The bytes the *runner* printed are not the service's answer,
// and the reason `status` prints for a platform is read as exactly that. Observed live on
// 2026-08-27: `reason: "Resolving dependencies"` under a build lookup, which is bun installing.
describe(looksLikeRunnerNoise, () => {
  /** What bun printed on the losing side of the scratch-directory race [observed — 2026-08-27]. */
  const BUN_PROGRESS = `Resolving dependencies\nResolved, downloaded and extracted [214]\n`;

  it("recognises bun's install progress with nothing else to show for the run", () => {
    expect(
      looksLikeRunnerNoise({ tool: 'eas', exitCode: 1, stdout: '', stderr: BUN_PROGRESS })
    ).toBe(true);
  });

  it("recognises npx's install notice, which names the package it is fetching", () => {
    // The package name is *in* the noise, which is why the CLI-marker veto that guards
    // `looksLikeWrapperCrash` cannot be the test here: `eas-cli@latest` matches an EAS marker.
    expect(
      looksLikeRunnerNoise({
        tool: 'eas',
        exitCode: 1,
        stdout: '',
        stderr:
          'npm warn exec The following package was not found and will be installed: eas-cli@latest\n',
      })
    ).toBe(true);
  });

  it('leaves a real refusal alone, because the CLI answers on stdout', () => {
    // The shape a real refusal takes [observed — live against an unlinked project, 2026-08-26]: the
    // whole explanation on stdout, one sentence on stderr. Anything on stdout is an answer.
    expect(
      looksLikeRunnerNoise({
        tool: 'eas',
        exitCode: 1,
        stdout: 'EAS project not configured.\nRun "eas init" to configure it.\n',
        stderr: 'Resolving dependencies\nError: build:list command failed.\n',
      })
    ).toBe(false);
  });

  it('leaves a failure whose stderr starts with the tool alone', () => {
    expect(
      looksLikeRunnerNoise({
        tool: 'eas',
        exitCode: 1,
        stdout: '',
        stderr: EAS_AUTH_FAILURE,
      })
    ).toBe(false);
  });

  it('is not a claim about a run that worked', () => {
    expect(
      looksLikeRunnerNoise({ tool: 'eas', exitCode: 0, stdout: '[]', stderr: BUN_PROGRESS })
    ).toBe(false);
    // Nor about a spawn that never started: the caller reports the errno for that.
    expect(
      looksLikeRunnerNoise({ tool: 'eas', exitCode: null, stdout: '', stderr: BUN_PROGRESS })
    ).toBe(false);
  });

  it('is not a claim about a run that printed nothing at all', () => {
    expect(looksLikeRunnerNoise({ tool: 'eas', exitCode: 1, stdout: '', stderr: '' })).toBe(false);
  });
});

describe(runnerNoiseReason, () => {
  it('says the runner failed to deliver the CLI, and never that EAS said so', () => {
    const reason = runnerNoiseReason(
      { tool: 'eas', exitCode: 1 },
      'bunx eas-cli@latest',
      'Resolving dependencies'
    );

    expect(reason).toContain('bunx eas-cli@latest');
    expect(reason).toContain('failed to deliver the eas CLI');
    // The runner's line is quoted as the runner's, so a reader can see what it was without being
    // told it is an answer about their builds.
    expect(reason).toContain('"Resolving dependencies"');
    expect(reason).toContain('so nothing here is EAS');
  });
});
