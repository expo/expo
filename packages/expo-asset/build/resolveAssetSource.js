import { getAssetByID } from '@react-native/assets-registry/registry';
import AssetSourceResolver from './AssetSourceResolver';
let _customSourceTransformer;
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
        return null;
    }
    const resolver = new AssetSourceResolver(
    // Doesn't matter since this is removed on web
    'https://expo.dev', null, asset);
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
//# sourceMappingURL=resolveAssetSource.js.map