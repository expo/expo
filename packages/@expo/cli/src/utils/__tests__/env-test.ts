import * as process from 'node:process';

import { env, envIsWebcontainer } from '../env';

jest.mock('node:process', () => jest.requireActual('node:process'));

describe('REACT_NATIVE_PACKAGER_HOSTNAME', () => {
  beforeEach(() => {
    delete process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  });

  it('returns null when unset', () => {
    expect(env.REACT_NATIVE_PACKAGER_HOSTNAME).toBe(null);
  });

  it('returns null when only whitespace', () => {
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ' \t ';
    expect(env.REACT_NATIVE_PACKAGER_HOSTNAME).toBe(null);
  });

  it('trims the hostname', () => {
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME = '  foobar.dev  ';
    expect(env.REACT_NATIVE_PACKAGER_HOSTNAME).toBe('foobar.dev');
  });
});

describe(envIsWebcontainer, () => {
  it('returns false without running in stackblitz', () => {
    expect(envIsWebcontainer()).toBe(false);
  });

  it('returns true when running in stackblitz', () => {
    process.env.SHELL = '/bin/jsh';
    process.versions.webcontainer = '1.33.7';

    expect(envIsWebcontainer()).toBe(true);
  });
});
