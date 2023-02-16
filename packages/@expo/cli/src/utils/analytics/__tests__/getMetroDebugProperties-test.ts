import { ExpoConfig } from '@expo/config';

import { resolveMetroVersionFromProject } from '../../../start/server/metro/resolveFromProject';
import { getMetroDebugProperties } from '../getMetroDebugProperties';

jest.mock('../rudderstackClient');
jest.mock('../../../start/server/metro/resolveFromProject');

const fakeExpoConfig = {
  sdkVersion: '47.0.0',
  jsEngine: 'hermes',
} as ExpoConfig;

describe(getMetroDebugProperties, () => {
  it('returns expo sdk and metro versions', () => {
    jest.mocked(resolveMetroVersionFromProject).mockReturnValue('1.33.7');

    const debugTool = { name: 'flipper', version: '4.2.0' };
    const properties = getMetroDebugProperties('/fake-project', fakeExpoConfig, debugTool);

    expect(properties).toMatchObject({
      sdkVersion: fakeExpoConfig.sdkVersion,
      metroVersion: '1.33.7',
    });
  });

  it('returns the debug tool', () => {
    const debugTool = { name: 'flipper', version: '4.2.0' };
    const properties = getMetroDebugProperties('/fake-project', fakeExpoConfig, debugTool);

    expect(properties).toMatchObject({
      toolName: debugTool.name,
      toolVersion: debugTool.version,
    });
  });
});
