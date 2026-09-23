import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getQuestGoogleServices } from './generateDynamicMacros';

const googleServices = {
  project_info: { project_id: 'expo-project', project_number: '123' },
  client: [
    {
      client_info: {
        mobilesdk_app_id: '1:123:android:mobile',
        android_client_info: { package_name: 'host.exp.exponent' },
      },
      api_key: [{ current_key: 'api-key' }],
    },
  ],
  configuration_version: '1',
};

describe('getQuestGoogleServices', () => {
  it('replaces only the app ID', () => {
    const result = JSON.parse(
      getQuestGoogleServices(JSON.stringify(googleServices), '1:123:android:quest')
    );
    const expected = structuredClone(googleServices);
    expected.client[0].client_info.mobilesdk_app_id = '1:123:android:quest';
    assert.deepEqual(result, expected);
  });
});
