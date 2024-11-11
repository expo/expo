import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withGradleProperties,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('expo-sqlite/package.json');

export type WithSQLiteProps = {
  customBuildFlags?: string;
  enableFTS?: boolean;
  useSQLCipher?: boolean;
  android: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
  };
  ios: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
  };
};

const withSQLite: ConfigPlugin<WithSQLiteProps | void> = (config, props) => {
  if (!props) {
    return config;
  }

  config = withSQLiteAndroidProps(config, props);
  config = withSQLiteIOSProps(config, props);
  return config;
};

const withSQLiteAndroidProps: ConfigPlugin<WithSQLiteProps> = (config, props) => {
  return withGradleProperties(config, (config) => {
    const customBuildFlags = props?.android?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.android?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.android?.useSQLCipher ?? props?.useSQLCipher;

    config.modResults = updateAndroidBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.customBuildFlags',
      customBuildFlags
    );
    config.modResults = updateAndroidBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.enableFTS',
      enableFTS
    );
    config.modResults = updateAndroidBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.useSQLCipher',
      useSQLCipher
    );
    return config;
  });
};

const withSQLiteIOSProps: ConfigPlugin<WithSQLiteProps> = (config, props) => {
  return withPodfileProperties(config, (config) => {
    const customBuildFlags = props?.ios?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.ios?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.ios?.useSQLCipher ?? props?.useSQLCipher;

    config.modResults = updateIOSBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.customBuildFlags',
      customBuildFlags
    );
    config.modResults = updateIOSBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.enableFTS',
      enableFTS
    );
    config.modResults = updateIOSBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.useSQLCipher',
      useSQLCipher
    );

    return config;
  });
};

function updateAndroidBuildPropertyIfNeeded(
  properties: AndroidConfig.Properties.PropertiesItem[],
  name: string,
  value: any
): AndroidConfig.Properties.PropertiesItem[] {
  if (value !== undefined) {
    return AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      properties,
      name,
      String(value)
    );
  }
  return properties;
}

function updateIOSBuildPropertyIfNeeded(
  properties: Record<string, string>,
  name: string,
  value: any
): Record<string, string> {
  if (value !== undefined) {
    properties[name] = String(value);
    return properties;
  }
  return properties;
}

export default createRunOncePlugin(withSQLite, pkg.name, pkg.version);
