import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';
import type { JSONObject } from '@expo/json-file';

import { createLegacyPlugin } from './createLegacyPlugin';

const withAccessesContactNotes: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults = setAccessesContactNotes(config, config.modResults);
    return config;
  });
};

function setAccessesContactNotes(config: ExpoConfig, entitlementsPlist: JSONObject): JSONObject {
  if (config.ios?.accessesContactNotes) {
    return {
      ...entitlementsPlist,
      'com.apple.developer.contacts.notes': true,
    };
  }

  return entitlementsPlist;
}

export default createLegacyPlugin({
  packageName: 'expo-contacts',
  fallback: withAccessesContactNotes,
});
