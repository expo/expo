// Copyright 2026-present 650 Industries. All rights reserved.

internal import React

/**
 Loads a bundled packager image from React Native's asset catalog.

 When an app sets the `RCTUseAssetCatalog` Info.plist key, React Native compiles its bundled
 png/jpg/jpeg images into `RNAssets.bundle/Assets.car` instead of copying them as loose files,
 so the `file://` URL JS resolves for a `require()`d image points to a file that doesn't exist.
 See https://github.com/react/react-native/pull/30129.

 Returns `nil` for anything React Native doesn't put in the catalog, and always when the app
 hasn't opted in, so those sources keep their regular loading path.
 */
func assetCatalogImage(for url: URL?) -> UIImage? {
  guard usesAssetCatalog, let url, url.isFileURL, RCTAssetCatalogNameForURL(url) != nil else {
    return nil
  }
  return RCTImageFromLocalAssetURL(url)
}

// React Native reads the key with `boolValue`, which also accepts string values such as "YES".
private let usesAssetCatalog: Bool = {
  let value = Bundle.main.object(forInfoDictionaryKey: "RCTUseAssetCatalog")
  if let number = value as? NSNumber {
    return number.boolValue
  }
  if let string = value as? NSString {
    return string.boolValue
  }
  return false
}()
