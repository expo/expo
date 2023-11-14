import { ExpoConfig } from '@expo/config';

import { getMetroDebugProperties } from '../getMetroDebugProperties';

jest.mock('../rudderstackClient');

const fakeExpoConfig = {
  sdkVersion: '47.0.0',
  jsEngine: 'hermes',
} as ExpoConfig;

describe(getMetroDebugProperties, () => {
  it('returns expo sdk and metro versions', () => {
    const debugTool = { name: 'flipper', version: '4.2.0' };
    const properties = getMetroDebugProperties('/fake-project', fakeExpoConfig, debugTool);

    expect(properties).toMatchObject({
      sdkVersion: fakeExpoConfig.sdkVersion,
      metroVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/),
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
