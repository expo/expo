import * as process from 'node:process';

import { envIsStackblitz } from '../env';

jest.mock('node:process', () => jest.requireActual('node:process'));

describe(envIsStackblitz, () => {
  it('returns false without running in stackblitz', () => {
    expect(envIsStackblitz()).toBe(false);
  });

  it('returns true when running in stackblitz', () => {
    process.env.SHELL = '/bin/jsh';
    // @ts-expect-error
    process.versions.webcontainer = '1.33.7';

    expect(envIsStackblitz()).toBe(true);
  });
});
