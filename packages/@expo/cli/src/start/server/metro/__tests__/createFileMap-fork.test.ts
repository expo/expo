import { allowAssetsOutsideRoots } from '../createFileMap-fork';

describe(allowAssetsOutsideRoots, () => {
  const assets: typeof import('@expo/metro/metro/Assets') = require('@expo/metro/metro/Assets');
  const getAssetUrlPath = (assetPath: string) =>
    assets.getAssetUrlPath(assetPath, '/root', ['/root', '/external']);

  it('gives an asset outside every root no URL path, and leaves the others alone', () => {
    expect(() => getAssetUrlPath('/other/imgs/a.png')).toThrow('is not within projectRoot');

    allowAssetsOutsideRoots();
    expect(getAssetUrlPath('/other/imgs/a.png')).toBeNull();
    expect(getAssetUrlPath('/root/imgs/a.png')).toBe('imgs/a.png');
    expect(getAssetUrlPath('/external/imgs/a.png')).toBe('[metro-watchFolders]/1/imgs/a.png');

    // Applying it again doesn't wrap it again
    const patched = assets.getAssetUrlPath;
    allowAssetsOutsideRoots();
    expect(assets.getAssetUrlPath).toBe(patched);
  });
});
