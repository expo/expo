import * as process from 'node:process';

import { envIsWebcontainer } from '../env';

jest.mock('node:process', () => jest.requireActual('node:process'));

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
