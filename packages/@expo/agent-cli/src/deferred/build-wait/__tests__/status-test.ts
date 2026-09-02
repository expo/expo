import recordedView from '../../../__fixtures__/eas/build-view.json';
// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import {
  EXIT_OK,
  EXIT_OUTCOME_CANCELED,
  EXIT_OUTCOME_FAILED,
  EXIT_OUTCOME_TIMEOUT,
} from '../../../exitCodes';
import { exitCodeForOutcome, normalizeStatus, resolveTerminalStatus } from '../status';

describe(normalizeStatus, () => {
  // The casing `build:view --json` prints is not the casing `build:list --status` accepts, and
  // neither is pinned by anything this CLI controls, so both are one status here.
  it(`reads one status whichever way it is spelled`, () => {
    for (const spelling of [
      'IN_QUEUE',
      'in_queue',
      'in-queue',
      'IN-QUEUE',
      'In-Queue',
      '  in_queue  ',
    ]) {
      expect(normalizeStatus(spelling)).toBe('IN_QUEUE');
    }
  });

  it(`answers nothing for a value that is not a status`, () => {
    expect(normalizeStatus(null)).toBeNull();
    expect(normalizeStatus(undefined)).toBeNull();
    expect(normalizeStatus(42)).toBeNull();
    expect(normalizeStatus('')).toBeNull();
    expect(normalizeStatus('   ')).toBeNull();
  });
});

describe(resolveTerminalStatus, () => {
  // The casing the table normalizes *into* was a defensive guess until a signed-in machine could
  // ask. It is `SCREAMING_SNAKE`, and this reads it off the recorded payload rather than off a
  // string written here — see `src/__fixtures__/eas/README.md`.
  it(`ends the wait on the status a real build:view printed`, () => {
    expect(recordedView.status).toBe('FINISHED');
    expect(resolveTerminalStatus(recordedView.status)).toEqual({
      outcome: 'finished',
      exitCode: EXIT_OK,
    });
  });

  it(`ends the wait on a finished build, with the success code`, () => {
    for (const spelling of ['FINISHED', 'finished', 'Finished']) {
      expect(resolveTerminalStatus(spelling)).toEqual({
        outcome: 'finished',
        exitCode: EXIT_OK,
      });
    }
  });

  it(`ends the wait on a failed build, with the outcome-failed code`, () => {
    for (const spelling of ['ERRORED', 'errored']) {
      expect(resolveTerminalStatus(spelling)).toEqual({
        outcome: 'errored',
        exitCode: EXIT_OUTCOME_FAILED,
      });
    }
  });

  // Both spellings are in the wild: the GraphQL enum has one `l`, plenty of prose has two.
  it(`ends the wait on a canceled build, however it is spelled`, () => {
    for (const spelling of ['CANCELED', 'CANCELLED', 'canceled', 'cancelled']) {
      expect(resolveTerminalStatus(spelling)).toEqual({
        outcome: 'canceled',
        exitCode: EXIT_OUTCOME_CANCELED,
      });
    }
  });

  // PENDING_CANCEL is a cancellation that has not happened yet: the build is still running, and
  // it resolves to CANCELED or to FINISHED. Ending here would report an outcome that is not known.
  it(`keeps polling through every status that is not an outcome`, () => {
    for (const status of [
      'NEW',
      'IN_QUEUE',
      'in-queue',
      'IN_PROGRESS',
      'in-progress',
      'PENDING_CANCEL',
      'pending-cancel',
      'AWAITING_BUILD',
    ]) {
      expect(resolveTerminalStatus(status)).toBeNull();
    }
  });

  // The safe failure is to keep waiting: a status this table has never heard of is far more
  // likely to be a new non-terminal state than a finished build nobody may report.
  it(`keeps polling on a status it does not know`, () => {
    for (const status of ['SOMETHING_NEW', 'QUARANTINED', 'finishing', '']) {
      expect(resolveTerminalStatus(status)).toBeNull();
    }
  });

  it(`keeps polling when the payload carried no status at all`, () => {
    expect(resolveTerminalStatus(null)).toBeNull();
    expect(resolveTerminalStatus(undefined)).toBeNull();
    expect(resolveTerminalStatus({ status: 'FINISHED' })).toBeNull();
  });
});

describe(exitCodeForOutcome, () => {
  // The exit code is the contract of this command (llp/0010 §Exit codes), so the whole mapping is
  // pinned here rather than inferred from the two callers.
  it(`maps every outcome to its code`, () => {
    expect(exitCodeForOutcome('finished')).toBe(EXIT_OK);
    expect(exitCodeForOutcome('errored')).toBe(EXIT_OUTCOME_FAILED);
    expect(exitCodeForOutcome('canceled')).toBe(EXIT_OUTCOME_CANCELED);
    expect(exitCodeForOutcome('timeout')).toBe(EXIT_OUTCOME_TIMEOUT);
  });

  it(`keeps the outcome codes inside the band the convention reserves`, () => {
    for (const outcome of ['errored', 'canceled', 'timeout'] as const) {
      expect(exitCodeForOutcome(outcome)).toBeGreaterThanOrEqual(20);
      expect(exitCodeForOutcome(outcome)).toBeLessThanOrEqual(29);
    }
  });
});
