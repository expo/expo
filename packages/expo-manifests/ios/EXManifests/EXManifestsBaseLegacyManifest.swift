//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc public class EXManifestBaseLegacyManifest : EXManifestsManifest {
  override func expoClientConfigRootObject() -> Dictionary<String, Any>? {
    return self.rawManifestJSON()
  }

  override func expoGoConfigRootObject() -> Dictionary<String, Any>? {
    return self.rawManifestJSON()
  }

  @objc public override func stableLegacyId() -> String {
    return self.rawManifestJSON().optionalValue(forKey: "originalFullName") ?? self.legacyId()
  }

  @objc public override func scopeKey() -> String {
    return self.rawManifestJSON().optionalValue(forKey: "scopeKey") ?? self.stableLegacyId()
  }

  @objc public override func easProjectId() -> String? {
    return self.rawManifestJSON().optionalValue(forKey: "projectId")
  }

  @objc public override func bundleUrl() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "bundleUrl")
  }

  @objc public override func sdkVersion() -> String? {
    return self.rawManifestJSON().optionalValue(forKey: "sdkVersion")
  }

  @objc public func assets() -> [Any]? {
    return self.rawManifestJSON().optionalValue(forKey: "assets")
  }
}
