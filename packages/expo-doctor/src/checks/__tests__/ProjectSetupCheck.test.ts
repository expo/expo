import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { asMock } from '../../__tests__/asMock';
import { ProjectSetupCheck } from '../ProjectSetupCheck';

jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  projectRoot,
};

describe('runAsync', () => {
  // unintentionally bare check
  it('returns result with isSuccessful = true if no ios/ android folders and no config plugins', async () => {
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if ios/ android folders but no config plugins', async () => {
    vol.fromJSON({
      [projectRoot + '/ios/something.pbxproj']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false with ios/ android folders and config plugins present, not in gitignore', async () => {
    asMock(spawnAsync)
      .mockResolvedValueOnce({
        status: 0,
        stdout: '',
      } as any)
      .mockRejectedValueOnce({
        status: -1,
      });
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = true with ios/ android folders and config plugins present, in gitignore', async () => {
    asMock(spawnAsync)
      .mockResolvedValueOnce({
        status: 0,
        stdout: '',
      } as any)
      .mockResolvedValueOnce({
        status: 0,
        stdout: '',
      } as any);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  // multiple lock files
  it('returns result with isSuccessful = true if just one lock file', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + npm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/package-lock.json']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + pnpm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/pnpm-lock.yaml']: 'test',
    });
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
