import semver from 'semver';

const postedWarnings: { [key: string]: boolean } = {};

/**
 * Used for deprecating values and throwing an error if a given version of Expo has passed.
 */
export default function warnDeprecated(
  library: string,
  deprecated: string,
  options: {
    replacement?: string;
    currentVersion?: string;
    versionToRemove?: string;
  } = {}
) {
  const { currentVersion, versionToRemove, replacement } = options;
  const key = `${library}:${deprecated}:${replacement}`;
  if (!postedWarnings[key]) {
    postedWarnings[key] = true;
  }

  if (
    !currentVersion ||
    !currentVersion.length ||
    !versionToRemove ||
    !versionToRemove.length ||
    !semver.gte(versionToRemove, currentVersion)
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
