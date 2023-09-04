import { ExecutionEnvironment } from 'expo-constants';
import { unmockAllProperties } from 'jest-expo';

import { describeManifest, mockConstants } from './ManifestTestUtils';

beforeEach(() => {
  unmockAllProperties();
  jest.resetModules();
  jest.resetAllMocks();
});

describeManifest({
  extra: {
    expoClient: {
      name: 'wat',
      slug: 'wat',
      originalFullName: '@example/abc',
    },
  },
})((manifestObj) => {
  beforeEach(() => {
    mockConstants(
      {
        executionEnvironment: ExecutionEnvironment.Standalone,
      },
      manifestObj
    );
  });

  it(`returns correct redirect URL from getRedirectUrl`, () => {
    const { getRedirectUrl } = require('../AuthSession');
    expect(getRedirectUrl()).toEqual('https://auth.expo.io/@example/abc');
  });
});

describeManifest({
  extra: {
    expoClient: {
      name: 'wat',
      slug: 'wat',
      originalFullName: '@anonymous/abc',
    },
  },
});
