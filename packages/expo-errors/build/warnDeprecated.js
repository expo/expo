import semver from 'semver';
import Constants from 'expo-constants';
const postedWarnings = {};
/**
 * Used for deprecating values and throwing an error if a given version of Expo has passed.
 */
export default function warnDeprecated(library, deprecated, options = {}) {
    const { versionToRemove, replacement } = options;
    const key = `${library}:${versionToRemove}:${deprecated}:${replacement}`;
    if (!postedWarnings[key]) {
        postedWarnings[key] = true;
    }
    if (!versionToRemove ||
        !versionToRemove.length ||
        !semver.gte(versionToRemove, Constants.expoVersion)) {
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
function appendLibrary(message, library) {
    return `${library}: ${message}`;
}
//# sourceMappingURL=warnDeprecated.js.map