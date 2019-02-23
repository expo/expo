export function registerAsset(asset: PackagerAsset): number {
  return _assets.push(asset);
}

export function getAssetByID(assetId: number): PackagerAsset {
  return _assets[assetId - 1];
}

export type PackagerAsset = {
  __packager_asset: boolean;
  fileSystemLocation: string;
  httpServerLocation: string;
  width?: number;
  height?: number;
  scales: number[];
  hash: string;
  name: string;
  type: string;
};

const _assets: PackagerAsset[] = [];
