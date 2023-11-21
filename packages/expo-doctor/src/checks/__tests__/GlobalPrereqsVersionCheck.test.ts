import spawnAsync from '@expo/spawn-async';
import { execSync } from 'child_process';

import { asMock } from '../../__tests__/asMock';
import { GlobalPrereqsVersionCheck } from '../GlobalPrereqsVersionCheck';

jest.mock('child_process');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if yarnpkg is installed', async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      status: 0,
    } as any);
    const check = new GlobalPrereqsVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if yarnpkg is not installed and npm version is in acceptable range', async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      status: 1,
    } as any);

    asMock(execSync).mockReturnValueOnce('8.19.3');
    const check = new GlobalPrereqsVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if yarnpkg is not installed and npm version is not in acceptable range', async () => {
    asMock(spawnAsync).mockResolvedValueOnce({
      status: 1,
    } as any);

    asMock(execSync).mockReturnValueOnce('5.0.0');
    const check = new GlobalPrereqsVersionCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
