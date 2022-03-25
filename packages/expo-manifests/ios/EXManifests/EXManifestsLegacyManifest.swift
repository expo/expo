//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc public class EXManifestsLegacyManifest : EXManifestBaseLegacyManifest {
  @objc public func releaseID() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "releaseId")
  }

  @objc public func commitTime() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "commitTime")
  }

  @objc public func bundledAssets() -> [Any]? {
    return self.rawManifestJSON().optionalValue(forKey: "bundledAssets")
  }

  @objc public func runtimeVersion() -> Any? {
    return self.rawManifestJSON()["runtimeVersion"]
  }

  @objc public func bundleKey() -> String? {
    return self.rawManifestJSON().optionalValue(forKey: "bundleKey")
  }

  @objc public func assetUrlOverride() -> String? {
    return self.rawManifestJSON().optionalValue(forKey: "assetUrlOverride")
  }
}
