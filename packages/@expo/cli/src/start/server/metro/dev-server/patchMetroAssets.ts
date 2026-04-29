/**
 * Patches Metro's `getAsset` to work around a bug where scaled assets (e.g. `icon@2x.png`)
 * fail to resolve when the unscaled base file doesn't exist on disk.
 *
 * Metro's `getAsset` validates the base asset path via `fileExistsInFileMap` before resolving
 * scaled variants. If only scaled files exist (no `@1x` base), the check throws prematurely.
 *
 * TODO(@kitten): Remove once metro hotfixes is published with the upstream fix.
 * See: https://github.com/facebook/metro/commit/c6478d78e9ec5a3442a9dc35077d8bf8e3a7d669
 */
export function patchMetroGetAsset(): void {
  // WARN: We assume this gives us the raw CJS module from `metro/Assets`
  const Assets = require('@expo/metro/metro/Assets');
  const originalGetAsset = Assets.getAsset;

  Assets.getAsset = async function patchedGetAsset(
    relativePath: string,
    projectRoot: string,
    watchFolders: ReadonlyArray<string>,
    platform: string | null | undefined,
    assetExts: ReadonlyArray<string>,
    // omit:
    _fileExistsInFileMap?: (absolutePath: string) => boolean
  ): Promise<Buffer> {
    return await originalGetAsset(
      relativePath,
      projectRoot,
      watchFolders,
      platform,
      assetExts,
      undefined,
    );
  };
}
