// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { CommandError } from '../../../utils/errors';
import {
  BACKOFF_AFTER_MS,
  BACKOFF_INTERVAL_MS,
  DEFAULT_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  resolveBuildWaitOptions,
} from '../resolveOptions';

/** The id every case waits on, in the shape EAS hands out. */
const ID = '2f1c9f0e-6b1e-4a3d-9c1a-0b6f1e2d3c4a';

describe(resolveBuildWaitOptions, () => {
  it(`waits on a build for 45 minutes, polling every 10 seconds, by default`, () => {
    expect(resolveBuildWaitOptions([ID])).toEqual({
      id: ID,
      kind: 'build',
      timeoutMs: DEFAULT_TIMEOUT_MS,
      intervalMs: DEFAULT_INTERVAL_MS,
      maxIntervalMs: BACKOFF_INTERVAL_MS,
      backoffAfterMs: BACKOFF_AFTER_MS,
      json: false,
      followups: true,
    });
  });

  it(`reads the durations with their units`, () => {
    expect(resolveBuildWaitOptions([ID, '--timeout', '2h', '--interval', '90s'])).toMatchObject({
      timeoutMs: 7_200_000,
      intervalMs: 90_000,
    });
  });

  // The backoff exists because a 45-minute wait at 10 seconds is 270 polls of an API nobody
  // promised to serve that often. An interval the caller chose is the interval they get.
  it(`stops backing off once the caller names an interval`, () => {
    const options = resolveBuildWaitOptions([ID, '--interval', '50ms']);

    expect(options.intervalMs).toBe(50);
    expect(options.maxIntervalMs).toBe(50);
  });

  it(`polls a submission when asked to`, () => {
    expect(resolveBuildWaitOptions([ID, '--submission']).kind).toBe('submission');
  });

  it(`reads the reporting flags`, () => {
    expect(resolveBuildWaitOptions([ID, '--json', '--no-followups'])).toMatchObject({
      json: true,
      followups: false,
    });
  });

  it(`asks for the id it has nothing to wait on without`, () => {
    expect.assertions(3);
    try {
      resolveBuildWaitOptions([]);
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('BAD_ARGS');
      // Errors are prompts (llp/0006): the way to find the id is the next command.
      expect(error.suggestedCommand).toContain('eas build:list');
    }
  });

  // eas-cli has no non-interactive listing for submissions, so that half of the error names the
  // command that printed the id instead of a listing that does not exist.
  it(`names where a submission id comes from when it is missing`, () => {
    expect(() => resolveBuildWaitOptions(['--submission'])).toThrow(/npx eas submit/);
    expect(() => resolveBuildWaitOptions(['--submission'])).not.toThrow(/submit:list/);
  });

  it(`refuses more than one id, instead of waiting on the first`, () => {
    expect(() => resolveBuildWaitOptions([ID, 'another-id'])).toThrow(/one build id/);
  });

  // A poll interval longer than the whole wait polls once and then times out, which is not what
  // anyone typing it meant.
  it(`refuses an interval longer than the timeout`, () => {
    expect.assertions(3);
    try {
      resolveBuildWaitOptions([ID, '--timeout', '30s', '--interval', '2m']);
    } catch (error: any) {
      expect(error.code).toBe('BAD_ARGS');
      expect(error.message).toContain('--interval');
      expect(error.message).toContain('--timeout');
    }
  });

  it(`accepts an interval exactly as long as the timeout`, () => {
    expect(resolveBuildWaitOptions([ID, '--timeout', '30s', '--interval', '30s'])).toMatchObject({
      timeoutMs: 30_000,
      intervalMs: 30_000,
    });
  });

  it(`rejects a duration that is not one`, () => {
    expect(() => resolveBuildWaitOptions([ID, '--timeout', 'soon'])).toThrow(/--timeout/);
    expect(() => resolveBuildWaitOptions([ID, '--interval', '0'])).toThrow(/greater than 0/);
  });

  it(`reports an unknown flag instead of ignoring it`, () => {
    expect(() => resolveBuildWaitOptions([ID, '--explain'])).toThrow(CommandError);
  });
});
