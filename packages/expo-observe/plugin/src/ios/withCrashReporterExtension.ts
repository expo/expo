import { ConfigPlugin, withXcodeProject } from 'expo/config-plugins';

import { addCrashReporterTarget } from './addCrashReporterTarget';
import withCrashReporterExtensionFiles from './crashReporterExtensionFiles';
import withEasAppExtension from './withEasAppExtension';

export const TARGET_NAME = 'ExpoObserveCrashReporter';

type CrashReporterExtensionProps = {
  bundleIdentifier?: string;
};

const withCrashReporterExtension: ConfigPlugin<CrashReporterExtensionProps> = (config, props) => {
  const appBundleIdentifier = config.ios?.bundleIdentifier;
  if (!appBundleIdentifier) {
    throw new Error(
      'expo-observe could not add the crash reporter extension because the app has no iOS bundle identifier. ' +
        'The extension derives its own bundle identifier from it. ' +
        'Set `ios.bundleIdentifier` in your app config.'
    );
  }

  const bundleIdentifier = props.bundleIdentifier ?? `${appBundleIdentifier}.${TARGET_NAME}`;
  if (props.bundleIdentifier !== undefined) {
    assertValidBundleIdentifier(props.bundleIdentifier, appBundleIdentifier);
  }

  config = withCrashReporterExtensionFiles(config, { targetName: TARGET_NAME });
  config = withEasAppExtension(config, { targetName: TARGET_NAME, bundleIdentifier });
  config = withXcodeProject(config, (config) => {
    addCrashReporterTarget(config.modResults, {
      targetName: TARGET_NAME,
      bundleIdentifier,
      marketingVersion: config.ios?.version ?? config.version ?? '1.0.0',
      buildNumber: config.ios?.buildNumber ?? '1',
      developmentTeam: config.ios?.appleTeamId,
    });
    return config;
  });
  return config;
};

export default withCrashReporterExtension;

// Apple allows only letters, digits, hyphens and periods in a bundle identifier. Each period
// separates two non-empty segments.
const BUNDLE_IDENTIFIER_REGEX = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/;

function assertValidBundleIdentifier(value: unknown, appBundleIdentifier: string) {
  const option = '`ios.crashReporter.bundleIdentifier` in the expo-observe plugin options';
  const example = `"${appBundleIdentifier}.${TARGET_NAME}"`;

  if (typeof value !== 'string' || !BUNDLE_IDENTIFIER_REGEX.test(value)) {
    throw new Error(
      `expo-observe could not add the crash reporter extension because its bundle identifier ${JSON.stringify(value)} is not valid. ` +
        'A bundle identifier can contain only letters, digits, hyphens (-) and periods (.), and it cannot start or end with a period or contain two periods in a row. ' +
        `Change ${option} to a value like ${example}, or remove it to use that default.`
    );
  }
  if (!value.startsWith(`${appBundleIdentifier}.`)) {
    throw new Error(
      `expo-observe could not add the crash reporter extension because its bundle identifier "${value}" ` +
        `is not a child of the app's bundle identifier "${appBundleIdentifier}". iOS requires this for crash reporter extensions. ` +
        `Change ${option} to a value that starts with "${appBundleIdentifier}.", or remove it to use the default ${example}.`
    );
  }
}
