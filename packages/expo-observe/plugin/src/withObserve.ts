import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import withCrashReporterExtension from './ios/withCrashReporterExtension';

const pkg = require('../../package.json');

export type ExpoObserveConfigPluginProps = {
  /**
   * iOS-specific options.
   */
  ios?: {
    /**
     * Adds a crash reporter extension to the app. The system runs the extension when the app
     * crashes, on iOS 27 and later. Pass an object to customize the extension.
     * @default false
     */
    crashReporter?:
      | boolean
      | {
          /**
           * Bundle identifier of the extension. It must start with the app's bundle identifier
           * followed by a dot.
           * @default `<ios.bundleIdentifier>.ExpoObserveCrashReporter`
           */
          bundleIdentifier?: string;
        };
  };
};

const withObserve: ConfigPlugin<ExpoObserveConfigPluginProps | void> = (config, props) => {
  const crashReporter: unknown = props?.ios?.crashReporter;
  if (
    crashReporter != null &&
    typeof crashReporter !== 'boolean' &&
    (typeof crashReporter !== 'object' || Array.isArray(crashReporter))
  ) {
    throw new Error(
      `expo-observe could not read \`ios.crashReporter\` because its value ${JSON.stringify(crashReporter)} is neither a boolean nor an object. ` +
        'Set it to `true` to add the crash reporter extension, or to an object such as `{ "bundleIdentifier": "..." }` to customize it.'
    );
  }
  if (crashReporter) {
    config = withCrashReporterExtension(
      config,
      crashReporter === true ? {} : (crashReporter as { bundleIdentifier?: string })
    );
  }
  return config;
};

export default createRunOncePlugin(withObserve, pkg.name, pkg.version);
