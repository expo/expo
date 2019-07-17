import ExpoFontLoader from './ExpoFontLoader';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export function fontFamilyNeedsScoping(name) {
    return false;
}
export function getAssetForSource(source) {
    if (typeof source === 'object' && 'uri' in source) {
        return {
            display: source.display,
            // @ts-ignore
            uri: source.uri || source.localUri
        };
    }
    if (typeof source !== 'string') {
        throw new Error(`Unexpected type ${typeof source} expected a URI string or Asset from expo-asset.`);
    }
    return {
        uri: source
    };
}
export async function loadSingleFontAsync(name, asset) {
    if (canUseDOM) {
        await ExpoFontLoader.loadAsync(name, asset);
    }
}
export function getNativeFontName(name) {
    return name;
}
//# sourceMappingURL=FontLoader.web.js.map