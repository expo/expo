import { ExpoConfig, getExpoSDKVersion } from '@expo/config';

import { resolveMetroVersionFromProject } from '../../../start/server/metro/resolveFromProject';
import { getMetroDebugProperties } from '../getMetroDebugProperties';

jest.mock('@expo/config');
jest.mock('../rudderstackClient');
jest.mock('../../../start/server/metro/resolveFromProject');

const fakeExpoConfig = {
  sdkVersion: '47.0.0',
  jsEngine: 'hermes',
} as ExpoConfig;

describe(getMetroDebugProperties, () => {
  it('returns expo sdk and metro versions', () => {
    jest.mocked(resolveMetroVersionFromProject).mockReturnValue('1.33.7');

    const debug = { name: 'flipper', version: '4.2.0' };
    const properties = getMetroDebugProperties('/fake-project', debug, fakeExpoConfig);

    expect(properties).toMatchObject({
      sdkVersion: fakeExpoConfig.sdkVersion,
      metroVersion: '1.33.7',
    });
  });

  it('returns the debug tool', () => {
    const debug = { name: 'flipper', version: '4.2.0' };
    const properties = getMetroDebugProperties('/fake-project', debug, fakeExpoConfig);

    expect(properties).toMatchObject({
      toolName: debug.name,
      toolVersion: debug.version,
    });
  });

  it('returns expo sdk from project', () => {
    jest.mocked(resolveMetroVersionFromProject).mockReturnValue('1.33.7');
    jest.mocked(getExpoSDKVersion).mockReturnValue('420.0.0');

    const debug = { name: 'chrome' };
    const properties = getMetroDebugProperties('/fake-project', debug);

    expect(properties).toMatchObject({
      sdkVersion: '420.0.0',
    });
  });
});
