import { Asset } from './Asset';
import { IS_ENV_WITH_LOCAL_ASSETS } from './PlatformUtils';
import { setCustomSourceTransformer } from './resolveAssetSource';

// Override React Native's asset resolution for `Image` components in contexts where it matters
if (IS_ENV_WITH_LOCAL_ASSETS) {
  setCustomSourceTransformer((resolver) => {
    try {
      // Bundler is using the hashAssetFiles plugin if and only if the fileHashes property exists
      if (resolver.asset.fileHashes) {
        const asset = Asset.fromMetadata(resolver.asset);
        return resolver.fromSource(asset.downloaded ? asset.localUri! : asset.uri);
      } else {
        return resolver.defaultAsset();
      }
    } catch {
      return resolver.defaultAsset();
    }
  });
}
