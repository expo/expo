import { Asset } from './Asset';
import { setCustomSourceTransformer } from './resolveAssetSource';
// Override React Native's asset resolution for `Image` components
setCustomSourceTransformer(resolver => {
    try {
        const asset = Asset.fromMetadata(resolver.asset);
        return resolver.fromSource(asset.downloaded ? asset.localUri : asset.uri);
    }
    catch (e) {
        return resolver.defaultAsset();
    }
});
//# sourceMappingURL=Asset.fx.js.map