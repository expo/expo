import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withGradleProperties,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('expo-sqlite/package.json');

interface Props {
  customBuildFlags?: string;
  enableFTS?: boolean;
  useSQLCipher?: boolean;
  useLibSQL?: boolean;
  withSQLiteVecExtension?: boolean;
  android: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    useLibSQL?: boolean;
    useSQLiteVec?: boolean;
    withSQLiteVecExtension?: boolean;
  };
  ios: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    useLibSQL?: boolean;
    withSQLiteVecExtension?: boolean;
  };
}

const withSQLite: ConfigPlugin<Props> = (config, props) => {
  config = withSQLiteAndroidProps(config, props);
  config = withSQLiteIOSProps(config, props);
  return config;
};

const withSQLiteAndroidProps: ConfigPlugin<Props> = (config, props) => {
  return withGradleProperties(config, (config) => {
    const customBuildFlags = props?.android?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.android?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.android?.useSQLCipher ?? props?.useSQLCipher;
    const useLibSQL = props?.android?.useLibSQL ?? props?.useLibSQL;
    const withSQLiteVecExtension =
      props?.android?.withSQLiteVecExtension ?? props?.withSQLiteVecExtension;

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
    config.modResults = updateAndroidBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.useLibSQL',
      useLibSQL
    );
    config.modResults = updateAndroidBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.withSQLiteVecExtension',
      withSQLiteVecExtension
    );

    return config;
  });
};

const withSQLiteIOSProps: ConfigPlugin<Props> = (config, props) => {
  return withPodfileProperties(config, (config) => {
    const customBuildFlags = props?.ios?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.ios?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.ios?.useSQLCipher ?? props?.useSQLCipher;
    const useLibSQL = props?.ios?.useLibSQL ?? props?.useLibSQL;
    const withSQLiteVecExtension =
      props?.ios?.withSQLiteVecExtension ?? props?.withSQLiteVecExtension;

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
    config.modResults = updateIOSBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.useLibSQL',
      useLibSQL
    );
    config.modResults = updateIOSBuildPropertyIfNeeded(
      config.modResults,
      'expo.sqlite.withSQLiteVecExtension',
      withSQLiteVecExtension
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
