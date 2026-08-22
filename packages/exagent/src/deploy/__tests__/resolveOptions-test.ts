import { resolveDeployOptions } from '../resolveOptions';

describe(resolveDeployOptions, () => {
  it(`should request nothing when no target flag is given`, () => {
    // No flags means "decide from the project", which needs a probe the resolver must not run.
    expect(resolveDeployOptions([])).toEqual({
      web: false,
      native: null,
      json: false,
      followups: true,
    });
  });

  it(`should resolve the web target`, () => {
    expect(resolveDeployOptions(['--web', '--json', '--no-followups'])).toEqual({
      web: true,
      native: null,
      json: true,
      followups: false,
    });
  });

  it(`should default the native build profile to production`, () => {
    expect(resolveDeployOptions(['--native', '--platform', 'ios'])).toEqual({
      web: false,
      native: { platform: 'ios', profile: 'production' },
      json: false,
      followups: true,
    });
  });

  it(`should treat --platform as a request for the native target`, () => {
    expect(resolveDeployOptions(['--platform', 'android', '--profile', 'preview'])).toEqual({
      web: false,
      native: { platform: 'android', profile: 'preview' },
      json: false,
      followups: true,
    });
  });

  it(`should resolve both targets at once`, () => {
    expect(resolveDeployOptions(['--web', '--platform', 'ios'])).toEqual({
      web: true,
      native: { platform: 'ios', profile: 'production' },
      json: false,
      followups: true,
    });
  });

  it(`should throw for --native without a platform`, () => {
    expect(() => resolveDeployOptions(['--native'])).toThrow(/--platform/);
  });

  it(`should throw for a platform EAS Build does not take`, () => {
    expect(() => resolveDeployOptions(['--platform', 'web'])).toThrow(/ios/);
  });

  it(`should throw for a build profile without a native target`, () => {
    // `--profile` names an `eas.json` build profile, which the web deploy never reads.
    expect(() => resolveDeployOptions(['--web', '--profile', 'preview'])).toThrow(/--profile/);
  });

  it(`should throw for an unknown flag`, () => {
    expect(() => resolveDeployOptions(['--prod'])).toThrow(/--prod/);
  });
});
