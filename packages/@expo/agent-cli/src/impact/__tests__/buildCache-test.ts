import { describeLookupFailure } from '../buildCache';

/** How the invocation is written when it has to be named, per `easCliLabel`. */
const INVOCATION = 'bunx eas-cli@latest';

describe(describeLookupFailure, () => {
  it('quotes the explanation the CLI put on stdout, not the one sentence on stderr', () => {
    // The shape a real refusal takes [observed — live against an unlinked project, 2026-08-26].
    expect(
      describeLookupFailure(
        {
          exitCode: 1,
          stdout: 'EAS project not configured.\nRun "eas init --force" to configure it.\n',
          stderr: 'Error: build:list command failed.\n',
        },
        INVOCATION
      )
    ).toBe('EAS project not configured.');
  });

  it('falls back to stderr when the CLI said nothing on stdout', () => {
    expect(
      describeLookupFailure(
        { exitCode: 1, stdout: '', stderr: 'Entity not authorized: Build (ID 123)\n' },
        INVOCATION
      )
    ).toBe('Entity not authorized: Build (ID 123)');
  });

  it('says so when the lookup ran and printed nothing at all', () => {
    expect(describeLookupFailure({ exitCode: 1, stdout: '', stderr: '' }, INVOCATION)).toBe(
      'the EAS CLI refused the lookup and printed nothing'
    );
  });

  // F93 — the one line this function may never return. `status` prints what comes back here as what
  // EAS answered about the caller's builds, and this is bun installing [observed — live, 2026-08-27,
  // six runs of `status --explain`: `reason: "Resolving dependencies"` on 3 of them].
  it("never reports the package runner's progress as the service's answer", () => {
    const reason = describeLookupFailure(
      {
        exitCode: 1,
        stdout: '',
        stderr: 'Resolving dependencies\nResolved, downloaded and extracted [214]\n',
      },
      INVOCATION
    );

    expect(reason).not.toBe('Resolving dependencies');
    expect(reason).toContain('failed to deliver the eas CLI');
    expect(reason).toContain(INVOCATION);
    // The runner's line is still shown, as the runner's: a reader who wants to know what happened
    // can see it without being told it is a fact about their account.
    expect(reason).toContain('"Resolving dependencies"');
  });

  it("keeps a real refusal's own words even when the runner also spoke", () => {
    // The common successful-install shape: bun's progress on stderr and the CLI's answer on stdout.
    // Anything on stdout is an answer, so the guard must stand down.
    expect(
      describeLookupFailure(
        {
          exitCode: 1,
          stdout: 'EAS project not configured.\n',
          stderr: 'Resolving dependencies\nError: build:list command failed.\n',
        },
        INVOCATION
      )
    ).toBe('EAS project not configured.');
  });
});
