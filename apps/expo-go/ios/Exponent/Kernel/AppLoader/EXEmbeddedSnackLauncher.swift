// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXUpdates

/**
 * A simple AppLauncher implementation for the embedded Snack runtime.
 * Builds an assetFilesMap from the embedded manifest so that JS can resolve
 * assets via ExpoUpdates.localAssets.
 */
@objc(EXEmbeddedSnackLauncher)
public class EmbeddedSnackLauncher: NSObject, AppLauncher {
  public var launchedUpdate: Update?
  public var launchAssetUrl: URL?
  public var assetFilesMap: [String: String]?

  public func isUsingEmbeddedAssets() -> Bool {
    return true
  }

  @objc public init(manifestJson: [String: Any], bundleUrl: URL) {
    self.launchAssetUrl = bundleUrl

    // Build assetFilesMap from manifest assets
    var map: [String: String] = [:]

    if let assets = manifestJson["assets"] as? [[String: Any]] {
      for asset in assets {
        guard let key = asset["key"] as? String,
              let nsBundleFilename = asset["nsBundleFilename"] as? String,
              let type = asset["type"] as? String else {
          continue
        }

        let nsBundleDir = asset["nsBundleDir"] as? String

        let path: String?
        if let dir = nsBundleDir {
          path = Bundle.main.path(forResource: nsBundleFilename, ofType: type, inDirectory: dir)
        } else {
          path = Bundle.main.path(forResource: nsBundleFilename, ofType: type)
        }

        if let resolvedPath = path {
          map[key] = URL(fileURLWithPath: resolvedPath).absoluteString
        }
      }
    }

    self.assetFilesMap = map

    super.init()
  }
}
