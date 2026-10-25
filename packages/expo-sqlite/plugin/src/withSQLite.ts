import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  WarningAggregator,
  withGradleProperties,
  withPodfileProperties,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

export interface Props {
  customBuildFlags?: string;
  enableFTS?: boolean;
  useSQLCipher?: boolean;
  withSQLiteVecExtension?: boolean;
  /** @deprecated libSQL support was removed. This property no longer has any effect. */
  useLibSQL?: boolean;
  android?: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    useSQLiteVec?: boolean;
    withSQLiteVecExtension?: boolean;
    /** @deprecated libSQL support was removed. This property no longer has any effect. */
    useLibSQL?: boolean;
  };
  ios?: {
    customBuildFlags?: string;
    enableFTS?: boolean;
    useSQLCipher?: boolean;
    withSQLiteVecExtension?: boolean;
    /** @deprecated libSQL support was removed. This property no longer has any effect. */
    useLibSQL?: boolean;
  };
}

// Warn rather than silently ignore the property, so an app that opted into libSQL learns that its
// build quietly switched to SQLite instead of discovering it at runtime.
function warnRemovedLibSQLProp(props: Props | undefined, platform: 'android' | 'ios') {
  const useLibSQL = props?.[platform]?.useLibSQL ?? props?.useLibSQL;
  if (useLibSQL === undefined) {
    return;
  }
  WarningAggregator.addWarningForPlatform(
    platform,
    'expo-sqlite useLibSQL',
    'libSQL support was removed, so this property is deprecated and no longer has any effect. The build always uses SQLite now. Remove `useLibSQL` from your app config.'
  );
}

const withSQLite: ConfigPlugin<Props> = (config, props) => {
  config = withSQLiteAndroidProps(config, props);
  config = withSQLiteIOSProps(config, props);
  return config;
};

const withSQLiteAndroidProps: ConfigPlugin<Props> = (config, props) => {
  return withGradleProperties(config, (config) => {
    warnRemovedLibSQLProp(props, 'android');

    const customBuildFlags = props?.android?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.android?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.android?.useSQLCipher ?? props?.useSQLCipher;
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
      'expo.sqlite.withSQLiteVecExtension',
      withSQLiteVecExtension
    );

    return config;
  });
};

const withSQLiteIOSProps: ConfigPlugin<Props> = (config, props) => {
  return withPodfileProperties(config, (config) => {
    warnRemovedLibSQLProp(props, 'ios');

    const customBuildFlags = props?.ios?.customBuildFlags ?? props?.customBuildFlags;
    const enableFTS = props?.ios?.enableFTS ?? props?.enableFTS;
    const useSQLCipher = props?.ios?.useSQLCipher ?? props?.useSQLCipher;
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
