import { configExistsAsync, loadConfigAsync } from '../../utils/metroConfigLoader';
import { MetroConfigCheck } from '../MetroConfigCheck';

jest.mock('../../utils/metroConfigLoader');

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: {},
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if there is no custom metro config', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(false);
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if there is a custom metro config and it includes Expo asset hashes', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(true);
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      // @ts-ignore: we don't need to mock the entire config
      transformer: {
        assetPlugins: [
          '/Users/keith/Github/just-kana/node_modules/expo-asset/tools/hashAssetFiles.js',
        ],
      },
    });
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if there is a custom metro config and it does not include Expo asset hashes', async () => {
    jest.mocked(configExistsAsync).mockResolvedValueOnce(true);
    jest.mocked(loadConfigAsync).mockResolvedValueOnce({
      // @ts-ignore: we don't need to mock the entire config
      transformer: {
        assetPlugins: [],
      },
    });
    const check = new MetroConfigCheck();
    const result = await check.runAsync({
      projectRoot: '/path/to/project',
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
