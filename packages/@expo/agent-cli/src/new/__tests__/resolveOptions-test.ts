import { resolveNewOptions } from '../resolveOptions';

describe(resolveNewOptions, () => {
  it(`should resolve the defaults from a directory alone`, () => {
    expect(resolveNewOptions(['my-app'])).toEqual({
      directory: 'my-app',
      name: undefined,
      install: true,
      git: true,
      json: false,
      followups: true,
    });
  });

  it(`should resolve every flag of the command`, () => {
    expect(
      resolveNewOptions([
        'apps/my-app',
        '--name',
        'My App',
        '--json',
        '--no-install',
        '--no-git',
        '--no-followups',
      ])
    ).toEqual({
      directory: 'apps/my-app',
      name: 'My App',
      install: false,
      git: false,
      json: true,
      followups: false,
    });
  });

  it(`should throw when no directory is given`, () => {
    // The directory is what makes the command headless: prompting for it is what `new` exists to
    // avoid (llp/0007 §new).
    expect(() => resolveNewOptions([])).toThrow(/Missing directory/);
    expect(() => resolveNewOptions(['--json'])).toThrow(/Missing directory/);
  });

  it(`should throw when more than one directory is given`, () => {
    expect(() => resolveNewOptions(['my-app', 'other-app'])).toThrow(/Expected one directory/);
  });

  it(`should throw for an empty --name`, () => {
    expect(() => resolveNewOptions(['my-app', '--name', '  '])).toThrow(/--name/);
  });

  it(`should throw for an unknown flag`, () => {
    expect(() => resolveNewOptions(['my-app', '--template'])).toThrow(/--template/);
  });
});
