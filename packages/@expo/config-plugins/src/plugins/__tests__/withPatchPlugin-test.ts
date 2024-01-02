import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { compileModsAsync } from '../../plugins/mod-compiler';
import { withInfoPlist } from '../ios-plugins';
import { withDangerousMod } from '../withDangerousMod';
import { createPatchPlugin } from '../withPatchPlugin';

jest.mock('@expo/spawn-async');
jest.mock('fs');
const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

describe(createPatchPlugin, () => {
  const projectRoot = '/app';

  beforeEach(() => {
    mockedSpawnAsync.mockClear();
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValue({ stdout: '', stderr: '' });
  });

  it('should do nothing when no patch files', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedSpawnAsync).not.toHaveBeenCalled();
  });

  it('should call git apply with existing patch file', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios.patch', '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedSpawnAsync).toHaveBeenCalled();
    expect(mockedSpawnAsync.mock.calls[0][0]).toEqual('git');
    expect(mockedSpawnAsync.mock.calls[0][1]).toEqual(['apply', '/app/cng-patches/ios.patch']);
  });

  it('should support custom patchRoot', async () => {
    const patchRoot = 'customPatchRoot';
    const config = createPatchPlugin('ios', { patchRoot })({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.mkdirpSync(`/app/${patchRoot}`);
    vol.writeFileSync(`/app/${patchRoot}/ios.patch`, '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedSpawnAsync).toHaveBeenCalled();
    expect(mockedSpawnAsync.mock.calls[0][0]).toEqual('git');
    expect(mockedSpawnAsync.mock.calls[0][1]).toEqual(['apply', `/app/${patchRoot}/ios.patch`]);
  });

  it('should throw if git is not installed', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios.patch', '');
    const error = new Error('spawn git ENOENT');
    // @ts-expect-error: Simulate spawn error
    error.code = 'ENOENT';
    mockedSpawnAsync.mockRejectedValue(error);
    await expect(() =>
      compileModsAsync(config, { projectRoot, platforms: ['ios'] })
    ).rejects.toThrowError(/Git is required to apply patches/);
  });

  it('should throw from git apply errors', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios.patch', '');
    mockedSpawnAsync.mockRejectedValue(new Error('git apply failed'));
    await expect(() =>
      compileModsAsync(config, { projectRoot, platforms: ['ios'] })
    ).rejects.toThrow();
  });

  it('should run patch plugin only once', async () => {
    let config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    config = createPatchPlugin('ios')(config);
    config = createPatchPlugin('ios')(config);

    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios.patch', '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedSpawnAsync).toHaveBeenCalledTimes(1);
  });

  it('should run patch plugin at the end', async () => {
    let config = {
      name: 'testproject',
      slug: 'testproject',
    };
    vol.mkdirpSync('/app/ios/testproject');
    vol.writeFileSync(
      '/app/ios/testproject/Info.plist',
      `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>`
    );

    const mockFn1 = jest.fn();
    const withPlugin1 = (config) => {
      return withInfoPlist(config, (config) => {
        mockFn1();
        return config;
      });
    };
    const mockFn2 = jest.fn();
    const withPlugin2 = (config) => {
      return withInfoPlist(config, (config) => {
        mockFn2();
        return config;
      });
    };
    const mockDangerous = jest.fn();
    const withDangerousPlugin = (config) => {
      return withDangerousMod(config, [
        'ios',
        async (config) => {
          mockDangerous();
          return config;
        },
      ]);
    };

    config = withPlugin1(config);
    config = createPatchPlugin('ios')(config);
    config = withPlugin2(config);
    config = withDangerousPlugin(config);

    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios.patch', '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockDangerous.mock.invocationCallOrder[0]).toBeLessThan(
      mockFn2.mock.invocationCallOrder[0]
    );
    expect(mockFn2.mock.invocationCallOrder[0]).toBeLessThan(mockFn1.mock.invocationCallOrder[0]);
    expect(mockFn1.mock.invocationCallOrder[0]).toBeLessThan(
      mockedSpawnAsync.mock.invocationCallOrder[0]
    );
  });
});
