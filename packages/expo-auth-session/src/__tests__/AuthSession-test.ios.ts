import { ExecutionEnvironment } from 'expo-constants';
import { unmockAllProperties } from 'jest-expo';

import { describeManifestTypes, mockConstants } from './ManifestTestUtils';

beforeEach(() => {
  unmockAllProperties();
  jest.resetModules();
  jest.resetAllMocks();
});

describeManifestTypes(
  {
    id: '@example/abc',
    originalFullName: '@example/abc',
  },
  {
    extra: {
      expoClient: {
        name: 'wat',
        slug: 'wat',
        originalFullName: '@example/abc',
      },
    },
  }
)((manifestObj) => {
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

describeManifestTypes(
  {
    id: '@anonymous/abc',
    originalFullName: undefined,
  },
  {
    extra: {
      expoClient: {
        name: 'wat',
        slug: 'wat',
        originalFullName: '@anonymous/abc',
      },
    },
  }
);
