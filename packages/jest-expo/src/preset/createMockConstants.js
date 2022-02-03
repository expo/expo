'use strict';

const { getConfig } = require('@expo/config');
const assert = require('assert');
const findUp = require('find-up');
const path = require('path');

function findUpPackageJson(root) {
  const packageJson = findUp.sync('package.json', { cwd: root });
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

/**
 * Returns an object with mock exports for the Constants module, such as the
 * manifest.
 */
module.exports = function createMockConstants() {
  const expoConfig = readExpoConfig();

  const mockDeveloper = '@test';
  const mockSlug = expoConfig.slug || 'test';
  const mockId = `${mockDeveloper}/${mockSlug}`;
  const mockLinkingUri = `exp://exp.host/${mockDeveloper}/${mockSlug}/--/`;
  const mockHostUri = `exp.host/${mockDeveloper}/${mockSlug}`;
  const mockSdkVersion = expoConfig.sdkVersion || '42.0.0';

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

function readExpoConfig() {
  // This file is under <package>/node_modules/jest-expo/src and we want to
  // start looking for app.json under <package>
  const nextDirectory = path.resolve(__dirname, '..', '..', '..');
  const projectRoot = path.dirname(findUpPackageJson(nextDirectory));
  return getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp;
}
