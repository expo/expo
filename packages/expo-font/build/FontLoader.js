import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import ExpoFontLoader from './ExpoFontLoader';
const isInClient = Constants.appOwnership === 'expo';
const isInIOSStandalone = Constants.appOwnership === 'standalone' && Platform.OS === 'ios';
export function fontFamilyNeedsScoping(name) {
    return ((isInClient || isInIOSStandalone) &&
        !Constants.systemFonts.includes(name) &&
        name !== 'System' &&
        !name.includes(Constants.sessionId));
}
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
    // @ts-ignore Error: Type 'string' is not assignable to type 'Asset'
    // We can't have a string here, we would have thrown an error if !isWeb
    // or returned Asset.fromModule if isWeb.
    return source;
}
export async function loadSingleFontAsync(name, input) {
    const asset = input;
    if (!asset.downloadAsync) {
        throw new Error('expo-font: loadSingleFontAsync expected asset of type Asset on native');
    }
    await asset.downloadAsync();
    if (!asset.downloaded) {
        throw new Error(`Failed to download asset for font "${name}"`);
    }
    await ExpoFontLoader.loadAsync(getNativeFontName(name), asset.localUri);
}
export function getNativeFontName(name) {
    if (fontFamilyNeedsScoping(name)) {
        return `${Constants.sessionId}-${name}`;
    }
    else {
        return name;
    }
}
//# sourceMappingURL=FontLoader.js.map