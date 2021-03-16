'use strict';

const fs = require('fs');
const JSON5 = require('json5');
const os = require('os');
const path = require('path');

/**
 * Returns an object with mock exports for the Constants module, such as the
 * manifest.
 */
module.exports = function createMockConstants() {
  const appConfig = _readAppConfiguration();
  const expoConfig = (appConfig && appConfig.expo) || {};

  const mockDeveloper = '@test';
  const mockSlug = expoConfig.slug || 'test';
  const mockId = `${mockDeveloper}/${mockSlug}`;
  const mockLinkingUri = `exp://exp.host/${mockDeveloper}/${mockSlug}/--/`;
  const mockHostUri = `exp.host/${mockDeveloper}/${mockSlug}`;
  const mockSdkVersion = expoConfig.sdkVersion || '36';

  return {
    deviceName: 'Test Phone',
    installationId: 'a01650bb-918d-40be-87be-cf376ab6189f',
    linkingUri: mockLinkingUri,
    manifest: {
      id: mockId,
      slug: mockSlug,
      extra: expoConfig.extra,
      hostUri: mockHostUri,
      sdkVersion: mockSdkVersion,
      scheme: expoConfig.scheme,
    },
  };
};

function _readAppConfiguration() {
  let json = null;

  // This file is under <package>/node_modules/jest-expo/src and we want to
  // start looking for app.json under <package>
  let nextDirectory = path.resolve(__dirname, '..', '..', '..');
  let currentDirectory;
  do {
    currentDirectory = nextDirectory;

    const candidatePath = path.join(currentDirectory, 'app.json');
    json = _safeReadFile(candidatePath, 'utf8');

    nextDirectory = path.dirname(currentDirectory);
  } while (json == null && currentDirectory !== nextDirectory && currentDirectory !== os.homedir());

  return json != null ? JSON5.parse(json) : null;
}

function _safeReadFile(filePath, options) {
  try {
    return fs.readFileSync(filePath, options);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
  return null;
}
