import { PackagerAsset } from '@react-native/assets-registry/registry';
import { Platform } from 'expo-modules-core';
import { PixelRatio } from 'react-native';

export type ResolvedAssetSource = {
  __packager_asset: boolean;
  width?: number;
  height?: number;
  uri: string;
  scale: number;
};

// Returns the Metro dev server-specific asset location.
function getScaledAssetPath(asset): string {
  const scale = AssetSourceResolver.pickScale(asset.scales, PixelRatio.get());
  const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  const type = !asset.type ? '' : `.${asset.type}`;
  if (__DEV__) {
    return asset.httpServerLocation + '/' + asset.name + scaleSuffix + type;
  } else {
    return asset.httpServerLocation.replace(/\.\.\//g, '_') + '/' + asset.name + scaleSuffix + type;
  }
}

export default class AssetSourceResolver {
  serverUrl: string;
  // where the jsbundle is being run from
  // NOTE(EvanBacon): Never defined on web.
  jsbundleUrl?: string | null;
  // the asset to resolve
  asset: PackagerAsset;

  constructor(
    serverUrl: string | undefined | null,
    jsbundleUrl: string | undefined | null,
    asset: PackagerAsset
  ) {
    this.serverUrl = serverUrl || 'https://expo.dev';
    this.jsbundleUrl = null;
    this.asset = asset;
  }

  // Always true for web runtimes
  isLoadedFromServer(): boolean {
    return true;
  }

  // Always false for web runtimes
  isLoadedFromFileSystem(): boolean {
    return false;
  }

  defaultAsset(): ResolvedAssetSource {
    return this.assetServerURL();
  }

  /**
   * @returns absolute remote URL for the hosted asset.
   */
  assetServerURL(): ResolvedAssetSource {
    const fromUrl = new URL(getScaledAssetPath(this.asset), this.serverUrl);
    fromUrl.searchParams.set('platform', Platform.OS);
    fromUrl.searchParams.set('hash', this.asset.hash);
    return this.fromSource(
      // Relative on web
      fromUrl.toString().replace(fromUrl.origin, '')
    );
  }

  fromSource(source: string): ResolvedAssetSource {
    return {
      __packager_asset: true,
      width: this.asset.width ?? undefined,
      height: this.asset.height ?? undefined,
      uri: source,
      scale: AssetSourceResolver.pickScale(this.asset.scales, PixelRatio.get()),
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
