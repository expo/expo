import { Asset } from './saveAssets';

export function createAssetMap({ assets }: { assets: Asset[] }) {
  // Convert the assets array to a k/v pair where the asset hash is the key and the asset is the value.
  return Object.fromEntries(assets.map((asset) => [asset.hash, asset]));
}
