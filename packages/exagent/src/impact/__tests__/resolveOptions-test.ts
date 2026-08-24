import { CommandError } from '../../utils/errors';
import { DEFAULT_PRESET, PRESETS, resolveImpactOptions } from '../resolveOptions';
import { IMPACT_CLASS_ORDER } from '../types';

describe(resolveImpactOptions, () => {
  it(`should default to every platform, the last build, and the balanced preset`, () => {
    expect(resolveImpactOptions([])).toEqual({
      platform: 'all',
      mode: 'last-build',
      buildId: null,
      base: null,
      head: null,
      profile: null,
      preset: DEFAULT_PRESET,
      assert: null,
      json: false,
      followups: true,
    });
  });

  it.each(['ios', 'android', 'all'] as const)(`should accept --platform %s`, (platform) => {
    expect(resolveImpactOptions(['--platform', platform]).platform).toBe(platform);
  });

  it(`should reject a platform with no native surface`, () => {
    expect(() => resolveImpactOptions(['--platform', 'web'])).toThrow(CommandError);
    expect(() => resolveImpactOptions(['--platform', 'web'])).toThrow(/no native surface/);
  });

  it.each(PRESETS)(`should accept --preset %s`, (preset) => {
    expect(resolveImpactOptions(['--preset', preset]).preset).toBe(preset);
  });

  it(`should reject a preset @expo/fingerprint does not know`, () => {
    expect(() => resolveImpactOptions(['--preset', 'paranoid'])).toThrow(/not a fingerprint preset/);
  });

  it.each(IMPACT_CLASS_ORDER)(`should accept --assert %s`, (impactClass) => {
    expect(resolveImpactOptions(['--assert', impactClass]).assert).toBe(impactClass);
  });

  it(`should reject an --assert value that is not a class`, () => {
    expect(() => resolveImpactOptions(['--assert', 'cheap'])).toThrow(/not one of the classes/);
  });

  it(`should switch to the eas-build mode when --build names one`, () => {
    expect(resolveImpactOptions(['--build', 'abc-123'])).toMatchObject({
      mode: 'eas-build',
      buildId: 'abc-123',
    });
  });

  it(`should switch to the git-refs mode when --base names one`, () => {
    expect(resolveImpactOptions(['--base', 'HEAD~1'])).toMatchObject({
      mode: 'git-refs',
      base: 'HEAD~1',
    });
  });

  it(`should reject --build together with --base`, () => {
    expect(() => resolveImpactOptions(['--build', 'abc', '--base', 'HEAD~1'])).toThrow(
      /only one comparison runs/
    );
  });

  it(`should reject --head without --base`, () => {
    expect(() => resolveImpactOptions(['--head', 'HEAD'])).toThrow(/no --base was given/);
  });

  it(`should accept --head with --base`, () => {
    expect(resolveImpactOptions(['--base', 'HEAD~1', '--head', 'HEAD'])).toMatchObject({
      mode: 'git-refs',
      base: 'HEAD~1',
      head: 'HEAD',
    });
  });

  it(`should read --json and --no-followups`, () => {
    expect(resolveImpactOptions(['--json', '--no-followups'])).toMatchObject({
      json: true,
      followups: false,
    });
  });

  it(`should keep the profile it was given`, () => {
    expect(resolveImpactOptions(['--profile', 'production']).profile).toBe('production');
  });

  it(`should treat a whitespace-only value as absent`, () => {
    expect(resolveImpactOptions(['--profile', '  '])).toMatchObject({
      profile: null,
      mode: 'last-build',
    });
  });

  it(`should reject a stray positional argument and name the flag that carries it`, () => {
    // llp/0010 §Registry rules (d): an argument a command has no place for is an error, not a
    // shrug. A build id is the one a caller is most likely to type here, because `build:wait`
    // takes one in that position.
    expect(() => resolveImpactOptions(['abc-123'])).toThrow(/--build/);
  });

  it(`should reject an unknown flag`, () => {
    expect(() => resolveImpactOptions(['--bogus'])).toThrow(CommandError);
  });
});
