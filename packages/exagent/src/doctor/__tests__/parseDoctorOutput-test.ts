import path from 'path';

import { buildDoctorCheckFollowUps, extractAdviceAction } from '../../followups/doctor';
import { formatDoctorReport } from '../format';
import { parseDoctorOutput } from '../parseDoctorOutput';
import type { DoctorReport } from '../types';

// The suite mocks `fs` with memfs, and these fixtures are real files on disk.
const realFs = jest.requireActual<typeof import('fs')>('fs');

/** Read one recorded `expo-doctor` run. See `fixtures/README.md` for how each was produced. */
function fixture(name: string): string {
  return realFs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

/** A full report around a parse, for the formatter and the follow-up builder. */
function report(raw: string, exitCode: number): DoctorReport {
  return { projectRoot: '/project', exitCode, raw, ...parseDoctorOutput(raw) };
}

describe(parseDoctorOutput, () => {
  describe('a verbose run with failures', () => {
    const parsed = parseDoctorOutput(fixture('verbose-five-failed.txt'));

    it('reads the counts off the summary line', () => {
      expect(parsed.passed).toBe(16);
      expect(parsed.failed).toBe(5);
      expect(parsed.checks).toHaveLength(21);
    });

    // The strong claim: every check the run says it ran is named, and every detail block belongs
    // to one of them. A consumer can treat `checks` as the whole report.
    it('claims a full parse', () => {
      expect(parsed.parse).toBe('full');
      expect(parsed.checks.filter((check) => check.status === 'failed')).toHaveLength(5);
    });

    it('keeps a passing check as a name with nothing to say', () => {
      expect(parsed.checks[0]).toEqual({
        name: 'Check for common project setup issues',
        status: 'passed',
        issues: [],
        advice: [],
      });
    });

    it('splits a failed check into what it found and what to do about it', () => {
      const check = parsed.checks.find((entry) => entry.name.includes('overridden dependencies'));

      expect(check).toEqual({
        name: 'Check for overridden dependencies',
        status: 'failed',
        issues: [
          'Incompatible versions of critical dependencies are installed, which is unsupported and may cause unexpected behavior.',
          '"expo" should install "@expo/cli@workspace:^56.1.12", but 57.0.11 is installed.',
          '"expo" should install "@expo/config@workspace:~56.0.9", but 57.0.6 is installed.',
          '"expo" should install "@expo/metro-config@workspace:~56.0.13", but 57.0.7 is installed.',
        ],
        advice: ["Reinstall your dependencies and check that they're not in a corrupted state."],
      });
    });

    // A failed check whose issues are a table keeps every line of it, because the table is the
    // answer and a summary of it would be this CLI inventing one.
    it('keeps a multi-line issue block whole', () => {
      const check = parsed.checks.find((entry) => entry.name.includes('match versions required'))!;

      expect(check.issues).toContain('expo                   ~57.0.15  57.0.9');
      expect(check.issues).toContain('9 packages out of date.');
      expect(check.advice).toContain(
        "Use 'npx expo install --check' to review and upgrade your dependencies."
      );
    });

    // The line that goes to stderr, after the detail blocks, is not a check — and it is not the
    // last check's advice either. A real run suggested "5 checks failed, indicating possible
    // issues with the project" as a thing to do about a check before this was pinned.
    it('does not read the closing stderr line as part of the report', () => {
      const closing = '5 checks failed, indicating possible issues with the project.';
      expect(parsed.checks.map((check) => check.name)).not.toContain(closing);

      const last = parsed.checks.find((entry) => entry.name.includes('match versions required'))!;
      expect(last.advice).toEqual([
        "Use 'npx expo install --check' to review and upgrade your dependencies.",
        'To ignore specific packages, add them to "expo.install.exclude" in package.json. Learn more: https://expo.fyi/dependency-validation',
      ]);
    });
  });

  describe('a run with no failures', () => {
    const parsed = parseDoctorOutput(fixture('all-passed.txt'));

    it('reads the "No issues detected" summary', () => {
      expect(parsed).toMatchObject({ passed: 21, failed: 0, parse: 'full' });
      expect(parsed.checks).toHaveLength(21);
      expect(parsed.checks.every((check) => check.status === 'passed')).toBe(true);
    });
  });

  // Without `--verbose` expo-doctor names only the checks that failed, so the list cannot be
  // complete. Saying `best-effort` is the point: the counts are right, the list is not the whole
  // run, and `raw` is where the rest is.
  describe('a run without --verbose', () => {
    const parsed = parseDoctorOutput(fixture('plain-five-failed.txt'));

    it('still reads the counts and every failure', () => {
      expect(parsed.passed).toBe(16);
      expect(parsed.failed).toBe(5);
      expect(parsed.checks).toHaveLength(5);
      expect(parsed.checks.every((check) => check.status === 'failed')).toBe(true);
    });

    it('admits the list is incomplete', () => {
      expect(parsed.parse).toBe('best-effort');
    });
  });

  describe('output the parser does not recognize', () => {
    it('reports a failed parse rather than a report of zeroes it made up', () => {
      expect(
        parseDoctorOutput('TypeError: Cannot read properties of undefined\n  at run\n')
      ).toEqual({ passed: 0, failed: 0, checks: [], parse: 'failed' });
      expect(parseDoctorOutput('')).toEqual({
        passed: 0,
        failed: 0,
        checks: [],
        parse: 'failed',
      });
    });

    // The raw text is the caller's, not the parser's, so this only pins that a failed parse never
    // claims a count. `raw` intact is asserted where the report is assembled, below.
    it('leaves the raw output to the caller', () => {
      const raw = 'expo-doctor crashed\n';
      expect(report(raw, 1).raw).toBe(raw);
      expect(report(raw, 1).parse).toBe('failed');
    });
  });

  describe('a run the parse only partly accounts for', () => {
    it('is best-effort when the check count does not match the summary', () => {
      const raw = [
        'Running 3 checks on your project...',
        '✔ Check one',
        '✖ Check two',
        '1/3 checks passed. 2 checks failed. Possible issues detected:',
        '',
        '✖ Check two',
        'It broke.',
      ].join('\n');

      const parsed = parseDoctorOutput(raw);
      expect(parsed).toMatchObject({
        passed: 1,
        failed: 2,
        parse: 'best-effort',
      });
      expect(parsed.checks).toHaveLength(2);
    });

    // A check can fail with no issues at all, and then it prints no detail block
    // [observed — `printFailedCheckIssueAndAdvice` returns early for an empty `issues`].
    it('is full when a failed check printed no block of its own', () => {
      const raw = [
        '✔ Check one',
        '✖ Check two',
        '1/2 checks passed. 1 check failed. Possible issues detected:',
      ].join('\n');

      expect(parseDoctorOutput(raw)).toMatchObject({
        passed: 1,
        failed: 1,
        parse: 'full',
      });
    });

    it('ignores the duration EXPO_DEBUG appends to a check line', () => {
      const raw = ['✔ Check one (12ms)', '1/1 checks passed. No issues detected!'].join('\n');

      expect(parseDoctorOutput(raw).checks).toEqual([
        { name: 'Check one', status: 'passed', issues: [], advice: [] },
      ]);
    });
  });
});

describe(extractAdviceAction, () => {
  it.each([
    // @ref llp/0021-stop-and-readiness-honesty.rfc.md §The next action is this CLI's — friction
    // run 7, F78. The advice is written for a person and names the Expo CLI; this CLI has the same
    // check, and adds the structured `check` object the rest of the surface expects.
    [
      "Use 'npx expo install --check' to review and upgrade your dependencies.",
      'npx exagent install --check',
    ],
    [
      'Upgrade to React Native 0.86.2 or later. For Expo projects, run `npx expo install --fix` to align them.',
      'npx exagent install --fix',
    ],
    [
      'Resolve schema errors in your app config. Learn more: https://docs.expo.dev/workflow/configuration/',
      'https://docs.expo.dev/workflow/configuration/',
    ],
    ["Reinstall your dependencies and check that they're not in a corrupted state.", null],
  ])('reads %s', (advice, expected) => {
    expect(
      extractAdviceAction({
        name: 'x',
        status: 'failed',
        issues: [],
        advice: [advice],
      })
    ).toBe(expected);
  });

  // Advice quotes package.json keys too, and only the first word tells a key from a command.
  it('does not mistake a quoted config key for a command', () => {
    expect(
      extractAdviceAction({
        name: 'x',
        status: 'failed',
        issues: [],
        advice: ['Add them to "expo.install.exclude" in package.json.'],
      })
    ).toBeNull();
  });
});

describe(buildDoctorCheckFollowUps, () => {
  it('turns the advice of the failing checks into next actions', () => {
    const followups = buildDoctorCheckFollowUps(report(fixture('verbose-five-failed.txt'), 1));

    // In the order the checks ran, capped at the three llp/0009 allows.
    expect(followups).toHaveLength(3);
    expect(followups.map((followup) => followup.command)).toEqual([
      'npx exagent install --fix',
      'https://docs.expo.dev/workflow/configuration/',
      'npx exagent install --check',
    ]);
    expect(followups[0]).toEqual({
      id: 'doctor-advice-exagent-install-fix',
      command: 'npx exagent install --fix',
      why: 'Check for Expo SDK versions affected by Hermes V1 regressions',
    });
  });

  it('has nothing to suggest for a run with no failures', () => {
    expect(buildDoctorCheckFollowUps(report(fixture('all-passed.txt'), 0))).toEqual([]);
  });

  it('suggests one command once, however many checks advise it', () => {
    const raw = [
      '✖ Check one',
      '✖ Check two',
      '0/2 checks passed. 2 checks failed. Possible issues detected:',
      '',
      '✖ Check one',
      'a',
      'Advice:',
      "Run 'npx expo install --fix'.",
      '',
      '✖ Check two',
      'b',
      'Advice:',
      "Run 'npx expo install --fix'.",
    ].join('\n');

    expect(buildDoctorCheckFollowUps(report(raw, 1))).toEqual([
      {
        id: 'doctor-advice-exagent-install-fix',
        command: 'npx exagent install --fix',
        why: 'Check one',
      },
    ]);
  });
});

describe(formatDoctorReport, () => {
  it('prints the counts and every failure with its advice', () => {
    const printed = formatDoctorReport(report(fixture('verbose-five-failed.txt'), 1));

    expect(printed).toContain('Checks       16/21 passed');
    expect(printed).toContain('Failed       5');
    expect(printed).toContain('Parse        full');
    expect(printed).toContain('✖ Check for overridden dependencies');
    expect(printed).toContain('→ Reinstall your dependencies');
    // A passing check has nothing to say, so the whole point of the report is the part that failed.
    expect(printed).not.toContain('Check for lock file');
  });

  // A parse that found nothing must not print an empty, confident-looking report.
  it('hands the raw output over when the parse found nothing', () => {
    const printed = formatDoctorReport(report('expo-doctor exploded\n', 1));

    expect(printed).toContain('expo-doctor said:');
    expect(printed).toContain('expo-doctor exploded');
    // Both count lines, because a green `0` failed would read as "no check failed" when the truth
    // is "no check was read".
    expect(printed).toContain('Checks       not reported');
    expect(printed).toContain('Failed       not reported');
  });
});
