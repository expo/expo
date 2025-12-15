import { Asset, ANDROID_EMBEDDED_URL_BASE_RESOURCE } from './Asset';
import { IS_ENV_WITH_LOCAL_ASSETS } from './PlatformUtils';
import resolveAssetSource, { setCustomSourceTransformer } from './resolveAssetSource';
// Override React Native's asset resolution for `Image` components in contexts where it matters
if (IS_ENV_WITH_LOCAL_ASSETS) {
    const setTransformer = resolveAssetSource.setCustomSourceTransformer || setCustomSourceTransformer;
    setTransformer(function expoAssetTransformer(resolver) {
        try {
            // Bundler is using the hashAssetFiles plugin if and only if the fileHashes property exists
            if ('fileHashes' in resolver.asset && resolver.asset.fileHashes) {
                const asset = Asset.fromMetadata(resolver.asset);
                if (asset.uri.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
                    // TODO(@kitten): See https://github.com/expo/expo/commit/ec940b57a87d99ab4f1d06d87126e662c3f04f04#r155340943
                    // It's unclear whether this is sound since this may be our own AssetSourceResolver, which doesn't have this method
                    // Please compare `AssetSourceResolver` type from `react-native/Libraries/Image/AssetSourceResolver` against `./AssetSourceResolver`
                    return resolver.resourceIdentifierWithoutScale();
                }
                return resolver.fromSource(asset.downloaded ? asset.localUri : asset.uri);
            }
            else {
                return resolver.defaultAsset();
            }
        }
        catch {
            return resolver.defaultAsset();
        }
    });
}
//# sourceMappingURL=Asset.fx.js.map