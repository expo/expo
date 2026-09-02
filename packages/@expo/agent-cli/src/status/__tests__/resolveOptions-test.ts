// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// The flags `status` grew when it absorbed `@expo/agent-cli impact`. Pure, so every combination is here
// rather than in an end-to-end run.

import { IMPACT_CLASS_ORDER } from '../../impact/types';
import { CommandError } from '../../utils/errors';
import { resolveAssertClass, resolveBuildId } from '../resolveOptions';

describe(resolveAssertClass, () => {
  it(`should answer null when the flag was not given`, () => {
    expect(resolveAssertClass(undefined)).toBeNull();
    expect(resolveAssertClass(null)).toBeNull();
  });

  it.each(IMPACT_CLASS_ORDER)(`should accept %s`, (impactClass) => {
    expect(resolveAssertClass(impactClass)).toBe(impactClass);
  });

  it(`should reject a class this does not report, naming the ones it does`, () => {
    expect(() => resolveAssertClass('native')).toThrow(CommandError);
    try {
      resolveAssertClass('native');
    } catch (error) {
      const message = (error as CommandError).message;
      expect(message).toContain('--assert native is not one of the classes');
      expect(message).toContain('js-only, dev-client-compatible, needs-native-build');
    }
  });
});

describe(resolveBuildId, () => {
  it(`should answer null when the flag was not given`, () => {
    expect(resolveBuildId(undefined, { explain: false })).toBeNull();
  });

  it(`should accept an id under --explain, trimmed`, () => {
    expect(resolveBuildId('  build-1  ', { explain: true })).toBe('build-1');
  });

  // The flag makes a network call, and `--explain` is the one word in this surface that means
  // "you may spend one". A `--build` that implied it would put the cost back where the design
  // took it out of.
  it(`should refuse --build without --explain, and suggest the line that works`, () => {
    try {
      resolveBuildId('build-1', { explain: false });
      throw new Error('should have thrown');
    } catch (error) {
      const commandError = error as CommandError;
      expect(commandError).toBeInstanceOf(CommandError);
      expect(commandError.message).toContain('--build needs --explain');
      expect(commandError.suggestedCommand).toBe(
        'npx @expo/agent-cli status --explain --build build-1'
      );
    }
  });

  it(`should refuse an empty id rather than asking the service about nothing`, () => {
    expect(() => resolveBuildId('   ', { explain: true })).toThrow(/--build needs the id/);
  });
});
