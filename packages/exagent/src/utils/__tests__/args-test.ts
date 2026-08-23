import { resolveDuration } from '../args';
import { CommandError } from '../errors';

describe(resolveDuration, () => {
  it(`falls back when the flag was not passed`, () => {
    expect(resolveDuration(undefined, '--timeout', 5000, { allowZero: false })).toBe(5000);
    expect(resolveDuration(null, '--duration', 2000, { allowZero: true })).toBe(2000);
  });

  it(`reads the value the caller named`, () => {
    expect(resolveDuration('250', '--timeout', 5000, { allowZero: false })).toBe(250);
    expect(resolveDuration('0', '--duration', 2000, { allowZero: true })).toBe(0);
  });

  // A window that collects nothing is a usable request; a timeout of zero is a mistake.
  it(`accepts zero only where zero means something`, () => {
    expect(() => resolveDuration('0', '--timeout', 5000, { allowZero: false })).toThrow(
      /greater than 0/
    );
    expect(resolveDuration(0, '--duration', 2000, { allowZero: true })).toBe(0);
  });

  it(`rejects a negative duration whichever flag it is on`, () => {
    expect(() => resolveDuration('-1', '--duration', 2000, { allowZero: true })).toThrow(
      /--duration/
    );
    expect(() => resolveDuration('-1', '--timeout', 5000, { allowZero: false })).toThrow(
      /--timeout/
    );
  });

  // Read as a string, so the report names what the user typed instead of `NaN`.
  it(`reports an unusable value as the user typed it`, () => {
    expect.assertions(3);
    try {
      resolveDuration('nope', '--duration', 2000, { allowZero: true });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.message).toContain('got nope');
    }
  });

  it(`rejects a value that is not finite`, () => {
    expect(() => resolveDuration('Infinity', '--timeout', 5000, { allowZero: false })).toThrow(
      /--timeout/
    );
  });

  // A wait is typed by a person far more often than it is computed, and `--timeout 2700000` is
  // not a duration anyone can read back.
  it(`reads a duration spelled with a unit`, () => {
    const wait = { allowZero: false } as const;
    expect(resolveDuration('50ms', '--interval', 1, wait)).toBe(50);
    expect(resolveDuration('90s', '--timeout', 1, wait)).toBe(90_000);
    expect(resolveDuration('30m', '--timeout', 1, wait)).toBe(1_800_000);
    expect(resolveDuration('2h', '--timeout', 1, wait)).toBe(7_200_000);
    expect(resolveDuration('1.5h', '--timeout', 1, wait)).toBe(5_400_000);
  });

  // `parseInt('45min')` is 45, which would have started a 45-millisecond wait for a 45-minute one.
  it(`rejects a unit it does not know instead of truncating the number`, () => {
    for (const value of ['45min', '2 h', '10sec', '1d', 's']) {
      expect(() => resolveDuration(value, '--timeout', 5000, { allowZero: false })).toThrow(
        `got ${value}`
      );
    }
  });

  it(`names the units it accepts in the error`, () => {
    expect(() => resolveDuration('nope', '--timeout', 5000, { allowZero: false })).toThrow(/30m/);
  });
});
