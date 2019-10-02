import { Platform, UnavailabilityError } from '@unimodules/core';
import invariant from 'invariant';
import { Dimensions } from 'react-native';
function getBasePath({ httpServerLocation }) {
    if (httpServerLocation[0] === '/') {
        return httpServerLocation.substr(1);
    }
    return httpServerLocation;
}
function getScale() {
    return Dimensions.get('window').scale;
}
function getScaledAssetPath(asset) {
    const scale = AssetSourceResolver.pickScale(asset.scales, getScale());
    const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
    const assetDir = getBasePath(asset);
    return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}
export default class AssetSourceResolver {
    constructor(serverUrl, jsbundleUrl, asset) {
        this.serverUrl = serverUrl;
        this.jsbundleUrl = jsbundleUrl;
        this.asset = asset;
    }
    isLoadedFromServer() {
        return !!this.serverUrl;
    }
    isLoadedFromFileSystem() {
        return !!(this.jsbundleUrl && this.jsbundleUrl.startsWith('file://'));
    }
    defaultAsset() {
        if (this.isLoadedFromServer()) {
            return this.assetServerURL();
        }
        return this.scaledAssetURLNearBundle();
    }
    assetServerURL() {
        invariant(!!this.serverUrl, 'need server to load from');
        return this.fromSource(this.serverUrl +
            getScaledAssetPath(this.asset) +
            '?platform=' +
            Platform.OS +
            '&hash=' +
            this.asset.hash);
    }
    scaledAssetPath() {
        return this.fromSource(getScaledAssetPath(this.asset));
    }
    scaledAssetURLNearBundle() {
        const path = this.jsbundleUrl || 'file://';
        return this.fromSource(path + getScaledAssetPath(this.asset));
    }
    resourceIdentifierWithoutScale() {
        throw new UnavailabilityError('react-native', 'resourceIdentifierWithoutScale()');
    }
    drawableFolderInBundle() {
        throw new UnavailabilityError('react-native', 'drawableFolderInBundle()');
    }
    fromSource(source) {
        return {
            __packager_asset: true,
            width: this.asset.width,
            height: this.asset.height,
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