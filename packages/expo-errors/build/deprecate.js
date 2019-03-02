import compareVersions from 'compare-versions';
import CodedError from './CodedError';
const postedWarnings = {};
/**
 * Used for deprecating values and throwing an error if a given version of Expo has passed.
 */
export default function deprecate(library, deprecatedAPI, options = {}) {
    const { currentVersion, versionToRemove, replacement } = options;
    const code = codeFromLibrary(library);
    const key = `${code}:${deprecatedAPI}:${replacement}`;
    if (!postedWarnings[key]) {
        postedWarnings[key] = true;
    }
    if (!currentVersion ||
        !versionToRemove ||
        compareVersions(currentVersion, versionToRemove) >= 0) {
        let message = `\`${deprecatedAPI}\` has been removed`;
        if (versionToRemove) {
            message = `${message} as of version "${versionToRemove}"`;
        }
        if (replacement && replacement.length) {
            message = `${message} please migrate to: \`${replacement}\``;
        }
        throw new CodedError(`ERR_DEPRECATED_API`, prependLibrary(library, message));
    }
    let message = `\`${deprecatedAPI}\` has been deprecated`;
    if (replacement && replacement.length) {
        message = `${message} in favor of \`${replacement}\``;
    }
    if (versionToRemove && versionToRemove.length) {
        message = `${message} and will be removed in version "${versionToRemove}"`;
    }
    console.warn(prependLibrary(library, message));
}
function prependLibrary(library, message) {
    return `${library}: ${message}`;
}
/**
 * Transform format:
 * Expo.AR -> EXPO_AR
 * expo-ar -> EXPO_AR
 */
function codeFromLibrary(library) {
    const code = library.replace(/[-\.]/g, '_').toUpperCase();
    return code;
}
//# sourceMappingURL=deprecate.js.map