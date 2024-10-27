import { IOSConfig } from '@expo/config-plugins';
import plist from '@expo/plist';
import { vol } from 'memfs';

import { simulatorBuildRequiresCodeSigning } from '../simulatorCodeSigning';

jest.mock('fs');

jest.mock('@expo/config-plugins', () => ({
  IOSConfig: {
    Entitlements: {
      getEntitlementsPath: jest.fn(),
    },
  },
}));

describe(simulatorBuildRequiresCodeSigning, () => {
  const projectRoot = '/';
  afterEach(() => vol.reset());

  it(`returns false if the entitlements file cannot be found`, () => {
    jest.mocked(IOSConfig.Entitlements.getEntitlementsPath).mockReturnValue(null);
    expect(simulatorBuildRequiresCodeSigning(projectRoot)).toBe(false);
  });
  it(`returns false if the entitlements file contains values which don't need to be signed`, () => {
    vol.fromJSON(
      {
        'entitlements.xml': plist.build({
          'aps-environment': 'development',
        }),
      },
      projectRoot
    );

    jest.mocked(IOSConfig.Entitlements.getEntitlementsPath).mockReturnValue('/entitlements.xml');
    expect(simulatorBuildRequiresCodeSigning(projectRoot)).toBe(false);
  });
  it(`returns true if the entitlements file contains values which require signing`, () => {
    vol.fromJSON(
      {
        'entitlements.xml': plist.build({
          'com.apple.developer.associated-domains': ['applinks:example.com'],
        }),
      },
      projectRoot
    );

    jest.mocked(IOSConfig.Entitlements.getEntitlementsPath).mockReturnValue('/entitlements.xml');
    expect(simulatorBuildRequiresCodeSigning(projectRoot)).toBe(true);
  });
});
