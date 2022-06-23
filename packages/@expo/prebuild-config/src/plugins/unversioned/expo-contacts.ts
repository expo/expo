import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';

import { createLegacyPlugin } from './createLegacyPlugin';

const withAccessesContactNotes: ConfigPlugin = config => {
  return withEntitlementsPlist(config, config => {
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
