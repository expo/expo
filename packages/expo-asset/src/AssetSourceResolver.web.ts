import { Platform } from '@unimodules/core';
import { UnavailabilityError } from '@unimodules/core';
import invariant from 'invariant';
import { Dimensions } from 'react-native';

type PackagerAsset = any;

function getBasePath({ httpServerLocation }: PackagerAsset): string {
  if (httpServerLocation[0] === '/') {
    return httpServerLocation.substr(1);
  }
  return httpServerLocation;
}

export type ResolvedAssetSource = {
  __packager_asset: boolean;
  width?: number;
  height?: number;
  uri: string;
  scale: number;
};

function getScale(): number {
  return Dimensions.get('window').scale;
}

function getScaledAssetPath(asset): string {
  const scale = AssetSourceResolver.pickScale(asset.scales, getScale());
  const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  const assetDir = getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}

export default class AssetSourceResolver {
  serverUrl?: string | null;
  // where the jsbundle is being run from
  jsbundleUrl?: string | null;
  // the asset to resolve
  asset: PackagerAsset;

  constructor(
    serverUrl: string | undefined | null,
    jsbundleUrl: string | undefined | null,
    asset: PackagerAsset
  ) {
    this.serverUrl = serverUrl;
    this.jsbundleUrl = jsbundleUrl;
    this.asset = asset;
  }
  isLoadedFromServer(): boolean {
    return !!this.serverUrl;
  }
  isLoadedFromFileSystem(): boolean {
    return !!(this.jsbundleUrl && this.jsbundleUrl.startsWith('file://'));
  }
  defaultAsset(): ResolvedAssetSource {
    if (this.isLoadedFromServer()) {
      return this.assetServerURL();
    }

    return this.scaledAssetURLNearBundle();
  }
  assetServerURL(): ResolvedAssetSource {
    invariant(!!this.serverUrl, 'need server to load from');
    return this.fromSource(
      this.serverUrl +
        getScaledAssetPath(this.asset) +
        '?platform=' +
        Platform.OS +
        '&hash=' +
        this.asset.hash
    );
  }
  scaledAssetPath(): ResolvedAssetSource {
    return this.fromSource(getScaledAssetPath(this.asset));
  }
  scaledAssetURLNearBundle(): ResolvedAssetSource {
    const path = this.jsbundleUrl || 'file://';
    return this.fromSource(path + getScaledAssetPath(this.asset));
  }
  resourceIdentifierWithoutScale(): ResolvedAssetSource {
    throw new UnavailabilityError('react-native', 'resourceIdentifierWithoutScale()');
  }
  drawableFolderInBundle(): ResolvedAssetSource {
    throw new UnavailabilityError('react-native', 'drawableFolderInBundle()');
  }
  fromSource(source: string): ResolvedAssetSource {
    return {
      __packager_asset: true,
      width: this.asset.width,
      height: this.asset.height,
      uri: source,
      scale: AssetSourceResolver.pickScale(this.asset.scales, getScale()),
    };
  }

  static pickScale(scales: number[], deviceScale: number): number {
    for (let i = 0; i < scales.length; i++) {
      if (scales[i] >= deviceScale) {
        return scales[i];
      }
    }
    return scales[scales.length - 1] || 1;
  }
}
