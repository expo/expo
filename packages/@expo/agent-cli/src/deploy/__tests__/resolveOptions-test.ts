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

  it(`should resolve the native target, which needs no platform`, () => {
    // One launch covers iOS and Android: the platforms are chosen in the browser, not here.
    expect(resolveDeployOptions(['--native'])).toEqual({
      web: false,
      native: { uploadRoot: undefined },
      json: false,
      followups: true,
    });
  });

  it(`should resolve the directory to upload`, () => {
    expect(resolveDeployOptions(['--native', '--upload-root', '../..'])).toEqual({
      web: false,
      native: { uploadRoot: '../..' },
      json: false,
      followups: true,
    });
  });

  it(`should resolve both targets at once`, () => {
    expect(resolveDeployOptions(['--web', '--native', '--json'])).toEqual({
      web: true,
      native: { uploadRoot: undefined },
      json: true,
      followups: true,
    });
  });

  it(`should explain that a native deploy no longer takes a platform`, () => {
    // The flag belonged to the EAS Build rail this command used to have, so a script that still
    // passes it has to be told what replaced it, not just that a flag is unknown.
    expect(() => resolveDeployOptions(['--platform', 'ios'])).toThrow(/launch\.expo\.dev/);
    expect(() => resolveDeployOptions(['--native', '--platform', 'android'])).toThrow(/--platform/);
  });

  it(`should explain that a native deploy no longer takes a build profile`, () => {
    expect(() => resolveDeployOptions(['--native', '--profile', 'preview'])).toThrow(/--profile/);
  });

  it(`should refuse an upload root without a native target`, () => {
    // `--upload-root` only describes the launch upload; the web deploy exports the project itself.
    expect(() => resolveDeployOptions(['--web', '--upload-root', '..'])).toThrow(/--native/);
  });

  it(`should refuse an empty upload root`, () => {
    expect(() => resolveDeployOptions(['--native', '--upload-root', '  '])).toThrow(
      /--upload-root/
    );
  });

  it(`should throw for an unknown flag`, () => {
    expect(() => resolveDeployOptions(['--prod'])).toThrow(/--prod/);
  });
});
