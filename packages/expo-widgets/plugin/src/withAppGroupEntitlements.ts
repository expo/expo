import { ConfigPlugin, InfoPlist, withEntitlementsPlist } from 'expo/config-plugins';

interface AppGroupEntitlementsProps {
  bundleIdentifier: string;
  targetName: string;
  groupIdentifier: string;
}

const withAppGroupEntitlements: ConfigPlugin<AppGroupEntitlementsProps> = (
  config,
  { groupIdentifier }
) =>
  withEntitlementsPlist(config, (config) => {
    config.ios = {
      ...config.ios,
      entitlements: _addApplicationGroupsEntitlement(
        config.ios?.entitlements ?? {},
        groupIdentifier
      ),
    };

    return config;
  });

export default withAppGroupEntitlements;

function _addApplicationGroupsEntitlement(entitlements: InfoPlist, groupIdentifier?: string) {
  if (!groupIdentifier) {
    return entitlements;
  }

  const existingApplicationGroups =
    (entitlements['com.apple.security.application-groups'] as string[]) ?? [];

  if (!existingApplicationGroups.includes(groupIdentifier)) {
    entitlements['com.apple.security.application-groups'] = [
      groupIdentifier,
      ...existingApplicationGroups,
    ];
  }

  return entitlements;
}
