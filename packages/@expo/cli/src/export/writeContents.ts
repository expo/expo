import { Asset } from './saveAssets';

export function createAssetMap({ assets }: { assets: Asset[] }) {
  // Convert the assets array to a k/v pair where the asset hash is the key and the asset is the value.
  return Object.fromEntries(assets.map((asset) => [asset.hash, asset]));
}

export function createSourceMapDebugHtml({ fileNames }: { fileNames: string[] }) {
  // Make a debug html so user can debug their bundles
  return `
      ${fileNames
        .filter((value) => value != null)
        .map((fileName) => `<script src="${fileName}"></script>`)
        .join('\n      ')}
      Open up this file in Chrome. In the JavaScript developer console, navigate to the Source tab.
      You can see a red colored folder containing the original source code from your bundle.
      `;
}
