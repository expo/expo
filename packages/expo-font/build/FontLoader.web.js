import { CodedError } from 'expo-modules-core';
import ExpoFontLoader from './ExpoFontLoader';
import { FontDisplay } from './Font';
function uriFromFontSource(asset) {
    if (typeof asset === 'string') {
        return asset || null;
    }
    else if (typeof asset === 'object') {
        return asset.uri || asset.localUri || null;
    }
    return null;
}
function displayFromFontSource(asset) {
    return asset.display || FontDisplay.AUTO;
}
export function fontFamilyNeedsScoping(name) {
    return false;
}
export function getAssetForSource(source) {
    const uri = uriFromFontSource(source);
    const display = displayFromFontSource(source);
    if (!uri || typeof uri !== 'string') {
        throwInvalidSourceError(uri);
    }
    return {
        uri: uri,
        display,
    };
}
function throwInvalidSourceError(source) {
    let type = typeof source;
    if (type === 'object')
        type = JSON.stringify(source, null, 2);
    throw new CodedError(`ERR_FONT_SOURCE`, `Expected font asset of type \`string | FontResource | Asset\` (number is not supported on web) instead got: ${type}`);
}
export async function loadSingleFontAsync(name, input) {
    if (typeof input !== 'object' || typeof input.uri !== 'string' || input.downloadAsync) {
        throwInvalidSourceError(input);
    }
    await ExpoFontLoader.loadAsync(name, input);
}
export function getNativeFontName(name) {
    return name;
}
//# sourceMappingURL=FontLoader.web.js.map