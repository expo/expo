import semver from 'semver';
import Constants from 'expo-constants';

const postedWarnings: { [key: string]: boolean } = {};

/**
 * Used for deprecating values and throwing an error if a given version of Expo has passed.
 */
export default function warnDeprecated(
  library: string,
  deprecated: string,
  options: {
    replacement?: string;
    versionToRemove?: string;
  } = {}
) {
  const { versionToRemove, replacement } = options;
  const key = `${library}:${versionToRemove}:${deprecated}:${replacement}`;
  if (!postedWarnings[key]) {
    postedWarnings[key] = true;
  }

  if (
    !versionToRemove ||
    !versionToRemove.length ||
    !semver.gte(versionToRemove, Constants.expoVersion)
  ) {
    let message = `\`${deprecated}\` has been removed`;
    if (versionToRemove) {
      message = `${message} as of version "${versionToRemove}"`;
    }
    if (replacement && replacement.length) {
      message = `${message} please migrate to: \`${replacement}\``;
    }
    throw new Error(appendLibrary(message, library));
  }

  let message = `\`${deprecated}\` has been deprecated`;
  if (replacement && replacement.length) {
    message = `${message} in favor of \`${replacement}\``;
  }
  if (versionToRemove && versionToRemove.length) {
    message = `${message} and will be removed in version "${versionToRemove}"`;
  }
  console.warn(appendLibrary(message, library));
}

function appendLibrary(message: string, library: string): string {
  return `${library}: ${message}`;
}
