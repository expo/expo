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
});
