import { Asset, ANDROID_EMBEDDED_URL_BASE_RESOURCE } from './Asset';
import { IS_ENV_WITH_LOCAL_ASSETS } from './PlatformUtils';
import resolveAssetSource, { setCustomSourceTransformer } from './resolveAssetSource';
// Override React Native's asset resolution for `Image` components in contexts where it matters
if (IS_ENV_WITH_LOCAL_ASSETS) {
    const setTransformer = resolveAssetSource.setCustomSourceTransformer || setCustomSourceTransformer;
    setTransformer((resolver) => {
        try {
            // Bundler is using the hashAssetFiles plugin if and only if the fileHashes property exists
            if ('fileHashes' in resolver.asset && resolver.asset.fileHashes) {
                const asset = Asset.fromMetadata(resolver.asset);
                if (asset.uri.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
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