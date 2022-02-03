import { NativeModules } from 'react-native';
import { getAssetByID } from './AssetRegistry';
import AssetSourceResolver from './AssetSourceResolver';
let _customSourceTransformer;
let _serverURL;
let _sourceCodeScriptURL;
function getSourceCodeScriptURL() {
    if (_sourceCodeScriptURL) {
        return _sourceCodeScriptURL;
    }
    let sourceCode = typeof nativeExtensions !== 'undefined' ? nativeExtensions.SourceCode : null;
    if (!sourceCode) {
        sourceCode = NativeModules?.SourceCode;
    }
    _sourceCodeScriptURL = sourceCode?.scriptURL;
    return _sourceCodeScriptURL;
}
function getDevServerURL() {
    if (_serverURL === undefined) {
        const sourceCodeScriptURL = getSourceCodeScriptURL();
        const match = sourceCodeScriptURL && sourceCodeScriptURL.match(/^https?:\/\/.*?\//);
        if (match) {
            // jsBundle was loaded from network
            _serverURL = match[0];
        }
        else {
            // jsBundle was loaded from file
            _serverURL = null;
        }
    }
    return _serverURL;
}
export function setCustomSourceTransformer(transformer) {
    _customSourceTransformer = transformer;
}
/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
export default function resolveAssetSource(source) {
    if (typeof source === 'object') {
        return source;
    }
    const asset = getAssetByID(source);
    if (!asset) {
        return undefined;
    }
    const resolver = new AssetSourceResolver(getDevServerURL(), null, asset);
    if (_customSourceTransformer) {
        return _customSourceTransformer(resolver);
    }
    return resolver.defaultAsset();
}
Object.defineProperty(resolveAssetSource, 'setCustomSourceTransformer', {
    get() {
        return setCustomSourceTransformer;
    },
});
export const { pickScale } = AssetSourceResolver;
//# sourceMappingURL=resolveAssetSource.web.js.map