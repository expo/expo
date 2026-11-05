import * as process from 'node:process';

import { env, envIsWebcontainer } from '../env';

jest.mock('node:process', () => jest.requireActual('node:process'));

describe('CI', () => {
  afterEach(() => {
    delete process.env.CI;
  });

  it('only treats 1 and true as CI', () => {
    for (const [value, expected] of [
      ['1', true],
      ['TRUE', true],
      ['yes', false],
      ['', false],
    ] as const) {
      process.env.CI = value;
      expect(env.CI).toBe(expected);
    }
  });
});

describe(envIsWebcontainer, () => {
  it('returns false without running in stackblitz', () => {
    expect(envIsWebcontainer()).toBe(false);
  });

  it('returns true when running in stackblitz', () => {
    process.env.SHELL = '/bin/jsh';
    // @ts-expect-error
    process.versions.webcontainer = '1.33.7';

    expect(envIsWebcontainer()).toBe(true);
  });
});
