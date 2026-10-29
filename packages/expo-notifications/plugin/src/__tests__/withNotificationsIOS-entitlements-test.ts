import {
  type ExportedConfigWithProps,
  type InfoPlist,
  withEntitlementsPlist,
  withInfoPlist,
} from 'expo/config-plugins';

import { withNotificationsIOS } from '../withNotificationsIOS';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withEntitlementsPlist: jest.fn(),
    withInfoPlist: jest.fn(),
    withXcodeProject: jest.fn((config) => config),
  };
});

const config = { name: 'test', slug: 'test' };

function mockModWithResults(withMod: unknown, modResults: InfoPlist) {
  (withMod as jest.Mock).mockImplementationOnce((config, action) =>
    action({ ...config, modResults } as ExportedConfigWithProps<InfoPlist>)
  );
}

describe('iOS notifications entitlements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds the aps-environment entitlement by default', () => {
    const entitlements: InfoPlist = {};
    mockModWithResults(withEntitlementsPlist, entitlements);

    withNotificationsIOS(config as any, {});

    expect(entitlements['aps-environment']).toBe('development');
  });

  it('does not add the aps-environment entitlement when remote notifications are disabled', () => {
    withNotificationsIOS(config as any, { enableRemoteNotifications: false });

    expect(withEntitlementsPlist).not.toHaveBeenCalled();
  });

  it('throws when background remote notifications are enabled but remote notifications are disabled', () => {
    expect(() =>
      withNotificationsIOS(config as any, {
        enableRemoteNotifications: false,
        enableBackgroundRemoteNotifications: true,
      })
    ).toThrow(/"enableBackgroundRemoteNotifications" requires "enableRemoteNotifications"/);
    expect(withInfoPlist).not.toHaveBeenCalled();
  });
});
