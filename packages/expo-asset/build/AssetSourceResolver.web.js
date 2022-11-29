import { Platform } from 'expo-modules-core';
import { Dimensions } from 'react-native';
// TODO(EvanBacon): This seems like a bad practice on web.
// The analogous system on web would be a CDN and/or the picture tag.
function getScale() {
    return Dimensions.get('window').scale;
}
// Returns the Metro dev server-specific asset location.
function getScaledAssetPath(asset) {
    const scale = AssetSourceResolver.pickScale(asset.scales, getScale());
    const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
    const type = !asset.type ? '' : `.${asset.type}`;
    return asset.httpServerLocation + '/' + asset.name + scaleSuffix + type;
}
export default class AssetSourceResolver {
    serverUrl;
    // where the jsbundle is being run from
    // NOTE(EvanBacon): Never defined on web.
    jsbundleUrl;
    // the asset to resolve
    asset;
    constructor(serverUrl, jsbundleUrl, asset) {
        if (!serverUrl) {
            throw new Error('Web assets require a server URL');
        }
        this.serverUrl = serverUrl;
        this.jsbundleUrl = null;
        this.asset = asset;
    }
    // Always true for web runtimes
    isLoadedFromServer() {
        return true;
    }
    // Always false for web runtimes
    isLoadedFromFileSystem() {
        return false;
    }
    defaultAsset() {
        return this.assetServerURL();
    }
    /**
     * @returns absolute remote URL for the hosted asset.
     */
    assetServerURL() {
        const fromUrl = new URL(this.serverUrl);
        fromUrl.pathname = getScaledAssetPath(this.asset);
        fromUrl.searchParams.set('platform', Platform.OS);
        fromUrl.searchParams.set('hash', this.asset.hash);
        return this.fromSource(fromUrl.toString());
    }
    fromSource(source) {
        return {
            __packager_asset: true,
            width: this.asset.width ?? undefined,
            height: this.asset.height ?? undefined,
            uri: source,
            scale: AssetSourceResolver.pickScale(this.asset.scales, getScale()),
        };
    }
    static pickScale(scales, deviceScale) {
        for (let i = 0; i < scales.length; i++) {
            if (scales[i] >= deviceScale) {
                return scales[i];
            }
        }
        return scales[scales.length - 1] || 1;
    }
}
//# sourceMappingURL=AssetSourceResolver.web.js.map