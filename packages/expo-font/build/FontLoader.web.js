import ExpoFontLoader from './ExpoFontLoader';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
export function fontFamilyNeedsScoping(name) {
    return false;
}
export function getAssetForSource(source) {
    if (typeof source === 'object' && 'uri' in source) {
        return {
            // @ts-ignore
            display: source.display,
            // @ts-ignore
            uri: source.uri || source.localUri,
        };
    }
    if (typeof source !== 'string') {
        throw new Error(`Unexpected type ${typeof source} expected a URI string or Asset from expo-asset.`);
    }
    return {
        uri: source,
    };
}
export async function loadSingleFontAsync(name, input) {
    const asset = input;
    if (asset.downloadAsync) {
        throw new Error('expo-font: loadSingleFontAsync expected an asset of type FontResource on web');
    }
    // Guard for SSR
    if (canUseDOM) {
        await ExpoFontLoader.loadAsync(name, input);
    }
}
export function getNativeFontName(name) {
    return name;
}
//# sourceMappingURL=FontLoader.web.js.map