import type { ExpoConfig } from '@expo/config';
import { vol } from 'memfs';

import { compileModsAsync } from '../../plugins/mod-compiler';
import { applyPatchAsync, getPatchChangedLinesAsync } from '../../utils/gitPatch';
import { withInfoPlist } from '../ios-plugins';
import { withDangerousMod } from '../withDangerousMod';
import { createPatchPlugin } from '../withPatchPlugin';

jest.mock('fs');
jest.mock('../../utils/gitPatch');
const mockedApplyPatchAsync = applyPatchAsync as jest.MockedFunction<typeof applyPatchAsync>;
const mockedGetPatchChangedLinesAsync = getPatchChangedLinesAsync as jest.MockedFunction<
  typeof getPatchChangedLinesAsync
>;
console.warn = jest.fn();

describe(createPatchPlugin, () => {
  const projectRoot = '/app';
  const templateChecksum = '86fb269d190d2c85f6e0468ceca42a20';

  beforeEach(() => {
    vol.reset();
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync(`/app/cng-patches/ios+${templateChecksum}.patch`, '');
  });

  it('should do nothing when no patch files', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.reset();
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync).not.toHaveBeenCalled();
  });

  it('should call git apply with existing patch file', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
    });
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync).toHaveBeenCalled();
    expect(mockedApplyPatchAsync.mock.calls[0][0]).toEqual(projectRoot);
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual(
      `/app/cng-patches/ios+${templateChecksum}.patch`
    );
  });

  it('should call git apply with existing patch file when no templateChecksum', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
    });
    vol.reset();
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync('/app/cng-patches/ios+.patch', '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync).toHaveBeenCalled();
    expect(mockedApplyPatchAsync.mock.calls[0][0]).toEqual(projectRoot);
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual('/app/cng-patches/ios+.patch');
  });

  it('should show warning for multiple patch files', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
    });

    const spyWarning = jest.spyOn(console, 'warn');
    vol.writeFileSync(`/app/cng-patches/ios+anotherchecksum.patch`, '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual(
      `/app/cng-patches/ios+${templateChecksum}.patch`
    );
    expect(spyWarning).toHaveBeenCalledWith(
      expect.stringMatching(
        /withPatchPlugin: Having multiple patch files in .+? is not supported. Only matched patch file ".+?" will be applied./
      )
    );
  });

  it('should show warning for non-matched patch file and try best effort to apply the non-matched patch file', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
    });

    const spyWarning = jest.spyOn(console, 'warn');
    vol.reset();
    vol.mkdirpSync('/app/cng-patches');
    vol.writeFileSync(`/app/cng-patches/ios+anotherchecksum.patch`, '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(spyWarning).toHaveBeenCalledWith(
      expect.stringMatching(
        /withPatchPlugin: Having patch files in .+? but none matching ".+?", using ".+?" instead./
      )
    );
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual(
      '/app/cng-patches/ios+anotherchecksum.patch'
    );
  });

  it('should show warning for a large patch file', async () => {
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
    });
    mockedGetPatchChangedLinesAsync.mockResolvedValueOnce(500);
    const spyWarning = jest.spyOn(console, 'warn');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual(
      `/app/cng-patches/ios+${templateChecksum}.patch`
    );
    expect(spyWarning).toHaveBeenCalledWith(
      expect.stringMatching(
        /withPatchPlugin: The patch file ".+?" has 500 changed lines, which exceeds the limit of 300/
      )
    );
  });

  it('should support custom patchRoot in app config', async () => {
    const patchRoot = 'customPatchRoot';
    const config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
      plugins: [['withPatchPlugin', { patchRoot }]],
    });
    vol.mkdirpSync(`/app/${patchRoot}`);
    vol.writeFileSync(`/app/${patchRoot}/ios+${templateChecksum}.patch`, '');
    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync.mock.calls[0][1]).toEqual(
      `/app/${patchRoot}/ios+${templateChecksum}.patch`
    );
  });

  it('should run patch plugin only once', async () => {
    let config = createPatchPlugin('ios')({
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
    });
    config = createPatchPlugin('ios')(config);
    config = createPatchPlugin('ios')(config);

    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockedApplyPatchAsync).toHaveBeenCalledTimes(1);
  });

  it('should run patch plugin at the end', async () => {
    let config: ExpoConfig = {
      name: 'testproject',
      slug: 'testproject',
      _internal: { templateChecksum },
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

    await compileModsAsync(config, { projectRoot, platforms: ['ios'] });
    expect(mockDangerous.mock.invocationCallOrder[0]).toBeLessThan(
      mockFn2.mock.invocationCallOrder[0]
    );
    expect(mockFn2.mock.invocationCallOrder[0]).toBeLessThan(mockFn1.mock.invocationCallOrder[0]);
    expect(mockFn1.mock.invocationCallOrder[0]).toBeLessThan(
      mockedApplyPatchAsync.mock.invocationCallOrder[0]
    );
  });
});
