import { withStringsXml, AndroidConfig, ConfigPlugin } from '@expo/config-plugins';

const withShareIntoSchemeString: ConfigPlugin<string> = (config, scheme) => {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        AndroidConfig.Resources.buildResourceItem({
          name: 'share_into_scheme',
          value: scheme,
          translatable: false,
        }),
      ],
      config.modResults
    );

    return config;
  });
};

export { withShareIntoSchemeString };
