import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';
import ExpoFontLoader from './ExpoFontLoader';
export function getAssetForSource(source) {
    if (source instanceof Asset) {
        return source;
    }
    if (typeof source === 'string') {
        return Asset.fromURI(source);
    }
    else if (typeof source === 'number') {
        return Asset.fromModule(source);
    }
    else if (typeof source === 'object' && typeof source.uri !== 'undefined') {
        return getAssetForSource(source.uri);
    }
    return source;
}
export async function loadSingleFontAsync(name, input) {
    const asset = input;
    if (!asset.downloadAsync) {
        throw new CodedError(`ERR_FONT_SOURCE`, '`loadSingleFontAsync` expected resource of type `Asset` from expo-asset on native');
    }
    await asset.downloadAsync();
    if (!asset.downloaded) {
        throw new CodedError(`ERR_DOWNLOAD`, `Failed to download asset for font "${name}"`);
    }
    await ExpoFontLoader.loadAsync(name, asset.localUri);
}
//# sourceMappingURL=FontLoader.js.map