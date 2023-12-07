import { vol } from 'memfs';

import { ExpoConfigCommonIssueCheck } from '../ExpoConfigCommonIssueCheck';

jest.mock('resolve-from');
jest.mock('fs');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '49.0.0',
  },
  projectRoot,
};

describe('runAsync', () => {
  it('returns result with isSuccessful = true if Expo config SDK version matches installed version', async () => {
    vol.fromJSON({
      [projectRoot + '/node_modules/expo/package.json']: `{
        "version": "49.0.0"
      }`,
    });

    const check = new ExpoConfigCommonIssueCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if Expo config SDK version does not match installed version', async () => {
    vol.fromJSON({
      [projectRoot + '/node_modules/expo/package.json']: `{
        "version": "48.0.0"
      }`,
    });

    const check = new ExpoConfigCommonIssueCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        sdkVersion: '49.0.0',
        slug: 'slug',
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
