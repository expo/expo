import { type InfoPlist, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

import { mockModWithResults } from './mockMods';
import withPushNotifications from '../ios/withPushNotifications';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withEntitlementsPlist: jest.fn(),
    withInfoPlist: jest.fn(),
  };
});

const config = { name: 'test', slug: 'test' };

describe(withPushNotifications, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds the aps-environment entitlement when push notifications are enabled', () => {
    const entitlements: InfoPlist = {};
    const infoPlist: InfoPlist = {};
    mockModWithResults(withEntitlementsPlist, entitlements);
    mockModWithResults(withInfoPlist, infoPlist);

    withPushNotifications(config as any, { enablePushNotifications: true });

    expect(entitlements['aps-environment']).toBe('development');
    expect(infoPlist['ExpoWidgets_EnablePushNotifications']).toBe(true);
  });

  it('keeps a pre-existing aps-environment value when push notifications are enabled', () => {
    const entitlements: InfoPlist = { 'aps-environment': 'production' };
    mockModWithResults(withEntitlementsPlist, entitlements);
    mockModWithResults(withInfoPlist, {});

    withPushNotifications(config as any, { enablePushNotifications: true });

    expect(entitlements['aps-environment']).toBe('production');
  });

  it('does not add the aps-environment entitlement when push notifications are disabled', () => {
    const infoPlist: InfoPlist = {};
    mockModWithResults(withInfoPlist, infoPlist);

    withPushNotifications(config as any, { enablePushNotifications: false });

    expect(withEntitlementsPlist).not.toHaveBeenCalled();
    expect(infoPlist['ExpoWidgets_EnablePushNotifications']).toBe(false);
  });
});
