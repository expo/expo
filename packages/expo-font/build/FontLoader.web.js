import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';
import ExpoFontLoader from './ExpoFontLoader';
import { FontDisplay } from './Font.types';
function uriFromFontSource(asset) {
    if (typeof asset === 'string') {
        return asset || null;
    }
    else if (typeof asset === 'number') {
        return uriFromFontSource(Asset.fromModule(asset));
    }
    else if (typeof asset === 'object' && typeof asset.uri === 'number') {
        return uriFromFontSource(asset.uri);
    }
    else if (typeof asset === 'object') {
        return asset.uri || asset.localUri || asset.default || null;
    }
    return null;
}
function displayFromFontSource(asset) {
    if (typeof asset === 'object' && 'display' in asset) {
        return asset.display || FontDisplay.AUTO;
    }
    return FontDisplay.AUTO;
}
export function getAssetForSource(source) {
    const uri = uriFromFontSource(source);
    const display = displayFromFontSource(source);
    if (!uri || typeof uri !== 'string') {
        throwInvalidSourceError(uri);
    }
    return {
        uri,
        display,
    };
}
function throwInvalidSourceError(source) {
    let type = typeof source;
    if (type === 'object')
        type = JSON.stringify(source, null, 2);
    throw new CodedError(`ERR_FONT_SOURCE`, `Expected font asset of type \`string | FontResource | Asset\` instead got: ${type}`);
}
// NOTE(EvanBacon): No async keyword!
export function loadSingleFontAsync(name, input) {
    if (typeof input !== 'object' || typeof input.uri !== 'string' || input.downloadAsync) {
        throwInvalidSourceError(input);
    }
    try {
        return ExpoFontLoader.loadAsync(name, input);
    }
    catch {
        // No-op.
    }
    return Promise.resolve();
}
//# sourceMappingURL=FontLoader.web.js.map