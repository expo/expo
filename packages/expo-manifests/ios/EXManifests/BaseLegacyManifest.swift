//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc(EXManifestBaseLegacyManifest)
@objcMembers
public class BaseLegacyManifest: Manifest {
  public override func expoClientConfigRootObject() -> [String: Any]? {
    return rawManifestJSON()
  }

  public override func expoGoConfigRootObject() -> [String: Any]? {
    return rawManifestJSON()
  }

  public override func stableLegacyId() -> String {
    return rawManifestJSON().optionalValue(forKey: "originalFullName") ?? legacyId()
  }

  public override func scopeKey() -> String {
    return rawManifestJSON().optionalValue(forKey: "scopeKey") ?? stableLegacyId()
  }

  public override func easProjectId() -> String? {
    return rawManifestJSON().optionalValue(forKey: "projectId")
  }

  public override func bundleUrl() -> String {
    return rawManifestJSON().requiredValue(forKey: "bundleUrl")
  }

  public override func expoGoSDKVersion() -> String? {
    return rawManifestJSON().optionalValue(forKey: "sdkVersion")
  }

  public func assets() -> [[String: Any]]? {
    return self.rawManifestJSON().optionalValue(forKey: "assets")
  }
}
