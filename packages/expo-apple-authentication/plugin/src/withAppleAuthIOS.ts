import { ConfigPlugin, withEntitlementsPlist, withInfoPlist } from 'expo/config-plugins';

/**
 * Enable including `strings` files from external packages.
 * Required for making the Apple Auth button support localizations.
 *
 * @param config
 * @returns
 */
export const withIOSMixedLocales: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults.CFBundleAllowMixedLocalizations =
      config.modResults.CFBundleAllowMixedLocalizations ?? true;

    return config;
  });
};

export const withAppleAuthIOS: ConfigPlugin = (config) => {
  config = withIOSMixedLocales(config);
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.applesignin'] = ['Default'];
    return config;
  });
};
