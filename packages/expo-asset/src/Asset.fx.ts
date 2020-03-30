import { Asset } from './Asset';
import { IS_MANAGED_ENV, IS_BARE_ENV_WITH_UPDATES } from './PlatformUtils';
import { setCustomSourceTransformer } from './resolveAssetSource';

// Override React Native's asset resolution for `Image` components in contexts where it matters
if (IS_MANAGED_ENV || IS_BARE_ENV_WITH_UPDATES) {
  setCustomSourceTransformer(resolver => {
    try {
      const asset = Asset.fromMetadata(resolver.asset);
      return resolver.fromSource(asset.downloaded ? asset.localUri! : asset.uri);
    } catch (e) {
      return resolver.defaultAsset();
    }
  });
}
