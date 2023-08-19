import { CodedError } from 'expo-modules-core';
import ExpoFontLoader from './ExpoFontLoader';
import { getAssetForSource, loadSingleFontAsync } from './FontLoader';
/**
 * @returns the server resources that should be statically extracted.
 * @private
 */
export function getStaticResources() {
    return ExpoFontLoader.getHeadElements();
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