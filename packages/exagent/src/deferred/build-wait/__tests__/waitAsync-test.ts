// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { CommandError } from '../../../utils/errors';
import { spawnSubprocessAsync, type SubprocessResult } from '../../../utils/subprocess';
import type { BuildWaitOptions } from '../resolveOptions';
import { intervalAt, MAX_CONSECUTIVE_FAILURES, pollBuildAsync, viewCommand } from '../waitAsync';

jest.mock('../../utils/subprocess', () => ({ spawnSubprocessAsync: jest.fn() }));
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));

const { event } = require('../../events') as { event: jest.Mock };
const spawn = spawnSubprocessAsync as jest.MockedFunction<typeof spawnSubprocessAsync>;

const ID = 'build-1';
const EAS = { command: '/usr/local/bin/eas', source: 'path' } as const;
const PROJECT_ROOT = '/project';

/** One scripted answer of the stub `eas`: what it printed and how it exited. */
type Step = Partial<SubprocessResult>;

/** A poll that answered with a build in this state. */
function answers(status: string, extra: Record<string, unknown> = {}): Step {
  return { exitCode: 0, stdout: `${JSON.stringify({ id: ID, status, ...extra })}\n` };
}

/** A poll that did not answer. */
function fails(exitCode = 1): Step {
  return { exitCode, stdout: '', stderr: 'Entity not authorized.\n' };
}

/**
 * Answer the polls with a scripted sequence, repeating the last step once it runs out.
 *
 * Repeating rather than throwing is what lets a timeout test say "it never finishes" in one line.
 */
function script(steps: Step[]): void {
  let index = 0;
  spawn.mockImplementation(async () => {
    const step = steps[Math.min(index++, steps.length - 1)]!;
    return { exitCode: 0, stdout: '', stderr: '', ...step };
  });
}

function options(overrides: Partial<BuildWaitOptions> = {}): BuildWaitOptions {
  return {
    id: ID,
    kind: 'build',
    timeoutMs: 60_000,
    intervalMs: 1_000,
    maxIntervalMs: 1_000,
    backoffAfterMs: 60_000,
    json: false,
    followups: true,
    ...overrides,
  };
}

/** Run a wait to its end, driving the clock so the sleeps between polls pass instantly. */
async function waitAsync(waitOptions: BuildWaitOptions) {
  const running = pollBuildAsync(EAS, PROJECT_ROOT, waitOptions);
  // Settled either way: the assertions are on the result, and an unhandled rejection here would
  // fail the run before the `expect` that is waiting for it.
  const settled = running.then(
    (value) => ({ value, error: null as unknown }),
    (error) => ({ value: null, error })
  );
  await jest.advanceTimersByTimeAsync(waitOptions.timeoutMs + waitOptions.maxIntervalMs);
  return settled;
}

/** The events of one name, in order. */
function emitted(name: string): Record<string, any>[] {
  return event.mock.calls.filter(([called]) => called === name).map(([, payload]) => payload);
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe(viewCommand, () => {
  it(`asks the command that answers for the kind of wait`, () => {
    expect(viewCommand({ kind: 'build' })).toBe('build:view');
    expect(viewCommand({ kind: 'submission' })).toBe('submit:view');
  });
});

describe(intervalAt, () => {
  it(`polls fast while the answer is still likely to change, then backs off`, () => {
    const backoff = options({ intervalMs: 10_000, maxIntervalMs: 30_000, backoffAfterMs: 300_000 });

    expect(intervalAt(0, backoff)).toBe(10_000);
    expect(intervalAt(299_999, backoff)).toBe(10_000);
    expect(intervalAt(300_000, backoff)).toBe(30_000);
    expect(intervalAt(2_000_000, backoff)).toBe(30_000);
  });
});

describe(pollBuildAsync, () => {
  it(`polls until the build finishes`, async () => {
    script([
      answers('IN_QUEUE', { queuePosition: 3 }),
      answers('IN_QUEUE', { queuePosition: 2 }),
      answers('IN_QUEUE', { queuePosition: 1 }),
      answers('IN_PROGRESS'),
      answers('IN_PROGRESS'),
      answers('FINISHED'),
    ]);

    const { value } = await waitAsync(options());

    expect(value).toMatchObject({
      outcome: 'finished',
      status: 'FINISHED',
      polls: 6,
      interrupted: false,
      // Five sleeps between six polls.
      waitedMs: 5_000,
    });
    expect(value!.payload).toMatchObject({ id: ID, status: 'FINISHED' });
  });

  it(`asks the EAS CLI for the build, as JSON, in the project`, async () => {
    script([answers('FINISHED')]);

    await waitAsync(options());

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith(EAS.command, ['build:view', ID, '--json'], {
      cwd: PROJECT_ROOT,
      output: 'capture',
    });
  });

  it(`asks about a submission with the submission command`, async () => {
    script([answers('FINISHED')]);

    await waitAsync(options({ kind: 'submission' }));

    expect(spawn).toHaveBeenCalledWith(
      EAS.command,
      ['submit:view', ID, '--json'],
      expect.anything()
    );
  });

  // Progress is on the event stream and not on stdout, so `--json` still prints one object
  // (llp/0006 §Output contract).
  it(`puts every poll on the event stream, with the queue position`, async () => {
    script([
      answers('IN_QUEUE', { queuePosition: 3, estimatedWaitTimeLeftSeconds: 240 }),
      answers('FINISHED'),
    ]);

    await waitAsync(options());

    expect(emitted('build_wait_poll')).toEqual([
      {
        kind: 'build',
        id: ID,
        poll: 1,
        status: 'IN_QUEUE',
        queuePosition: 3,
        estimatedWaitTimeLeftSeconds: 240,
        elapsedMs: 0,
      },
      {
        kind: 'build',
        id: ID,
        poll: 2,
        status: 'FINISHED',
        queuePosition: null,
        estimatedWaitTimeLeftSeconds: null,
        elapsedMs: 1_000,
      },
    ]);
  });

  it(`ends on a failed build, and on a canceled one`, async () => {
    script([answers('IN_PROGRESS'), answers('ERRORED')]);
    expect((await waitAsync(options())).value).toMatchObject({
      outcome: 'errored',
      status: 'ERRORED',
    });

    script([answers('CANCELED')]);
    expect((await waitAsync(options())).value).toMatchObject({ outcome: 'canceled' });
  });

  // A cancellation that has been asked for is not one that has happened: the build is still
  // running and still resolves to something.
  it(`polls through PENDING_CANCEL until it resolves`, async () => {
    script([
      answers('IN_PROGRESS'),
      answers('PENDING_CANCEL'),
      answers('PENDING_CANCEL'),
      answers('CANCELED'),
    ]);

    expect((await waitAsync(options())).value).toMatchObject({
      outcome: 'canceled',
      status: 'CANCELED',
      polls: 4,
    });
  });

  it(`keeps polling a status it has never heard of, rather than guessing`, async () => {
    script([answers('QUARANTINED'), answers('QUARANTINED'), answers('FINISHED')]);

    expect((await waitAsync(options())).value).toMatchObject({ outcome: 'finished', polls: 3 });
  });

  describe('the timeout', () => {
    it(`gives up with the last status it saw`, async () => {
      script([answers('IN_QUEUE'), answers('IN_PROGRESS')]);

      const { value } = await waitAsync(options({ timeoutMs: 5_000, intervalMs: 1_000 }));

      expect(value).toMatchObject({
        outcome: 'timeout',
        status: 'IN_PROGRESS',
        waitedMs: 5_000,
        polls: 6,
      });
    });

    // The build may have finished while this wait was asleep, so the deadline gets one last look.
    it(`polls once at the deadline instead of stopping an interval short`, async () => {
      script([answers('IN_PROGRESS'), answers('IN_PROGRESS'), answers('FINISHED')]);

      const { value } = await waitAsync(options({ timeoutMs: 2_000, intervalMs: 1_000 }));

      expect(value).toMatchObject({ outcome: 'finished', polls: 3, waitedMs: 2_000 });
    });

    it(`never sleeps past the deadline`, async () => {
      script([answers('IN_PROGRESS')]);

      const { value } = await waitAsync(options({ timeoutMs: 2_500, intervalMs: 1_000 }));

      // 0, 1000, 2000, then a 500ms sleep onto the deadline itself.
      expect(value).toMatchObject({ outcome: 'timeout', polls: 4, waitedMs: 2_500 });
    });

    it(`backs the interval off once the build is plainly a long one`, async () => {
      script([answers('IN_PROGRESS')]);

      await waitAsync(
        options({ timeoutMs: 2_000, intervalMs: 100, maxIntervalMs: 500, backoffAfterMs: 300 })
      );

      expect(emitted('build_wait_poll').map((poll) => poll.elapsedMs)).toEqual([
        0, 100, 200, 300, 800, 1300, 1800, 2000,
      ]);
    });
  });

  describe('a poll that does not answer', () => {
    it(`rides out a blip instead of ending the wait`, async () => {
      script([fails(), fails(), answers('IN_PROGRESS'), fails(), fails(), answers('FINISHED')]);

      const { value } = await waitAsync(options());

      expect(value).toMatchObject({ outcome: 'finished', polls: 6 });
      expect(emitted('build_wait_poll_failed')).toHaveLength(4);
    });

    it(`gives up after three in a row, and says the id may be a workflow's`, async () => {
      script([fails(), fails(), fails(), answers('FINISHED')]);

      const { value, error } = await waitAsync(options());

      expect(value).toBeNull();
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('BUILD_VIEW_FAILED');
      expect(error.message).toContain('workflow');
      // Errors are prompts (llp/0006): the last line is what a driving agent acts on, so it holds
      // the check that is *unconditionally* worth running — against the binary that actually ran.
      // The workflow command is conditional ("if it names a workflow run"), so it stays in `How:`.
      expect(error.suggestedCommand).toBe('/usr/local/bin/eas whoami');
      expect(error.message).toContain(`npx eas workflow:status ${ID} --wait --json`);
      // What the tool printed travels with the error, so the cause is not a second run away.
      expect(error.message).toContain('Entity not authorized');
      expect(spawn).toHaveBeenCalledTimes(MAX_CONSECUTIVE_FAILURES);
    });

    it(`sends a submission somewhere useful, not to the workflow command`, async () => {
      script([fails(), fails(), fails()]);

      const { error } = await waitAsync(options({ kind: 'submission' }));

      expect(error.suggestedCommand).toBe('/usr/local/bin/eas whoami');
      expect(error.message).not.toContain('workflow');
    });

    // @ref llp/0010 — a shim under the name `eas` that panics is not the EAS CLI reporting
    // anything, and quoting its backtrace under "What the tool printed" sends the reader after a
    // missing file inside a program that was never involved.
    it(`says the binary is not the CLI instead of quoting its crash`, async () => {
      const backtrace = 'Caused by:\n    No such file or directory (os error 2)\n\nStack backtrace:\n   2: tuft::main\n';
      script([
        { exitCode: 1, stderr: backtrace },
        { exitCode: 1, stderr: backtrace },
        { exitCode: 1, stderr: backtrace },
      ]);

      const { error } = await waitAsync(options());

      expect(error.message).toContain('/usr/local/bin/eas failed to run at all');
      expect(error.message).toContain('this may not be the real CLI');
      expect(error.message).not.toContain('What the tool printed');
      expect(error.message).not.toContain('tuft::main');
    });

    it(`counts every way a poll can fail`, async () => {
      const cases: [Step, string][] = [
        [fails(7), 'eas exited with code 7'],
        [{ exitCode: 0, stdout: 'Build not found\n' }, 'eas exited 0 but printed no JSON object'],
        [
          { exitCode: null, spawnError: Object.assign(new Error('nope'), { code: 'ENOENT' }) },
          'eas could not be run: ENOENT',
        ],
      ];

      for (const [step, message] of cases) {
        event.mockClear();
        script([step, answers('FINISHED')]);

        await waitAsync(options());

        expect(emitted('build_wait_poll_failed')[0]).toMatchObject({
          poll: 1,
          consecutiveFailures: 1,
          message,
        });
      }
    });

    it(`puts the failure on the event stream every time, before it gives up`, async () => {
      script([fails(), fails(), fails()]);

      await waitAsync(options());

      expect(
        emitted('build_wait_poll_failed').map((failure) => failure.consecutiveFailures)
      ).toEqual([1, 2, 3]);
    });
  });

  describe('an interrupt', () => {
    // A wait spends almost all of its time asleep, so a Ctrl-C that is only noticed by the child
    // is a Ctrl-C the caller waits out an interval for.
    it(`ends the wait during the sleep between polls`, async () => {
      script([answers('IN_PROGRESS')]);

      const running = pollBuildAsync(EAS, PROJECT_ROOT, options({ intervalMs: 30_000 }));
      await jest.advanceTimersByTimeAsync(0);
      process.emit('SIGINT');
      await jest.advanceTimersByTimeAsync(0);

      await expect(running).resolves.toMatchObject({
        outcome: 'canceled',
        interrupted: true,
        polls: 1,
      });
      // The wait did not sit out the interval first.
      expect(spawn).toHaveBeenCalledTimes(1);
    });

    // The signal reaches the child too, so the poll it interrupted comes back empty. That is a
    // stop, not a failed poll.
    it(`does not count the poll it interrupted as a failure`, async () => {
      let polls = 0;
      spawn.mockImplementation(async () => {
        if (++polls === 2) {
          process.emit('SIGINT');
          return { exitCode: 0, stdout: '', stderr: '' };
        }
        return { exitCode: 0, stdout: JSON.stringify({ status: 'IN_PROGRESS' }), stderr: '' };
      });

      const { value } = await waitAsync(options());

      expect(value).toMatchObject({ outcome: 'canceled', interrupted: true, polls: 2 });
      expect(emitted('build_wait_poll_failed')).toEqual([]);
    });

    it(`stops listening for signals once the wait is over`, async () => {
      const before = process.listenerCount('SIGINT');
      script([answers('FINISHED')]);

      await waitAsync(options());

      expect(process.listenerCount('SIGINT')).toBe(before);
    });

    it(`stops listening even when the wait ended by throwing`, async () => {
      const before = process.listenerCount('SIGINT');
      script([fails(), fails(), fails()]);

      await waitAsync(options());

      expect(process.listenerCount('SIGINT')).toBe(before);
    });
  });
});
