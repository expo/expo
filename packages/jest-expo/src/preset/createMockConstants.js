'use strict';

const { getConfig } = require('@expo/config');
const os = require('os');
const path = require('path');

/**
 * Returns an object with mock exports for the Constants module, such as the
 * manifest.
 */
module.exports = function createMockConstants() {
  const appConfig = _readAppConfiguration();
  const expoConfig = appConfig || {};

  const mockDeveloper = '@test';
  const mockSlug = expoConfig.slug || 'test';
  const mockId = `${mockDeveloper}/${mockSlug}`;
  const mockLinkingUri = `exp://exp.host/${mockDeveloper}/${mockSlug}/--/`;
  const mockHostUri = `exp.host/${mockDeveloper}/${mockSlug}`;
  const mockSdkVersion = expoConfig.sdkVersion || '42';

  return {
    deviceName: 'Test Phone',
    installationId: 'a01650bb-918d-40be-87be-cf376ab6189f',
    linkingUri: mockLinkingUri,
    manifest: {
      id: mockId,
      originalFullName: '@test/originaltest',
      currentFullName: mockId,
      slug: mockSlug,
      extra: expoConfig.extra,
      hostUri: mockHostUri,
      sdkVersion: mockSdkVersion,
      scheme: expoConfig.scheme,
    },
  };
};

function _readAppConfiguration() {
  let config = null;

  // This file is under <package>/node_modules/jest-expo/src and we want to
  // start looking for app.json under <package>
  let nextDirectory = path.resolve(__dirname, '..', '..', '..');
  let currentDirectory;
  do {
    currentDirectory = nextDirectory;

    try {
      config = getConfig(currentDirectory);
    } catch (e) {
      if (!e.message.includes('expected package.json path')) {
        throw e;
      }
    }

    nextDirectory = path.dirname(currentDirectory);
  } while (
    config == null &&
    currentDirectory !== nextDirectory &&
    currentDirectory !== os.homedir()
  );

  return config != null ? config.exp : null;
}
