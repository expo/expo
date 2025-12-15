import { CodedError, UnavailabilityError } from 'expo-modules-core';
import ExpoFontLoader from './ExpoFontLoader';
import { getAssetForSource, loadSingleFontAsync } from './FontLoader';
/**
 * @returns the server resources that should be statically extracted.
 * @private
 */
export function getServerResources() {
    if (!ExpoFontLoader.getServerResources) {
        throw new UnavailabilityError('expo-font', 'getServerResources');
    }
    return ExpoFontLoader.getServerResources();
}
/**
 * @returns clear the server resources from the global scope.
 * @private
 */
export function resetServerContext() {
    if (!ExpoFontLoader.resetServerContext) {
        throw new UnavailabilityError('expo-font', 'resetServerContext');
    }
    return ExpoFontLoader.resetServerContext();
}
export function registerStaticFont(fontFamily, source) {
    // MUST BE A SYNC FUNCTION!
    if (!source) {
        throw new CodedError(`ERR_FONT_SOURCE`, `Cannot load null or undefined font source: { "${fontFamily}": ${source} }. Expected asset of type \`FontSource\` for fontFamily of name: "${fontFamily}"`);
    }
    const asset = getAssetForSource(source);
    loadSingleFontAsync(fontFamily, asset);
}
//# sourceMappingURL=server.js.map