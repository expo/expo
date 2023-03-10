//  Copyright © 2021 650 Industries. All rights reserved.
import Foundation

@objc(EXManifestsLegacyManifest)
@objcMembers
public class LegacyManifest: BaseLegacyManifest {
  public func releaseID() -> String {
    return rawManifestJSON().requiredValue(forKey: "releaseId")
  }

  public func commitTime() -> String {
    return rawManifestJSON().requiredValue(forKey: "commitTime")
  }

  public func bundledAssets() -> [Any]? {
    return rawManifestJSON().optionalValue(forKey: "bundledAssets")
  }

  public func runtimeVersion() -> Any? {
    return rawManifestJSON().optionalValue(forKey: "runtimeVersion")
  }

  public func bundleKey() -> String? {
    return rawManifestJSON().optionalValue(forKey: "bundleKey")
  }

  public func assetUrlOverride() -> String? {
    return rawManifestJSON().optionalValue(forKey: "assetUrlOverride")
  }
}
