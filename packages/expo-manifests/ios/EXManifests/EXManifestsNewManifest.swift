//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc public class EXManifestsNewManifest : EXManifestsManifest {
  @objc public func rawId() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "id")
  }

  @objc public override func stableLegacyId() -> String {
    return self.rawId()
  }

  @objc public override func scopeKey() -> String {
    let extra: Dictionary<String, Any> = self.rawManifestJSON().requiredValue(forKey: "extra")
    return extra.requiredValue(forKey: "scopeKey")
  }

  private func extra() -> Dictionary<String, Any>? {
    return self.rawManifestJSON().optionalValue(forKey: "extra")
  }

  @objc public override func easProjectId() -> String? {
    guard let easConfig: Dictionary<String, Any> = self.extra()?.optionalValue(forKey: "eas") else {
      return nil
    }
    return easConfig.optionalValue(forKey: "projectId")
  }

  @objc public func createdAt() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "createdAt")
  }

  @objc public func runtimeVersion() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "runtimeVersion")
  }

  @objc public override func sdkVersion() -> String? {
    let runtimeVersion = self.runtimeVersion()
    if runtimeVersion == "exposdk:UNVERSIONED" {
      return "UNVERSIONED"
    }

    let regex = try! NSRegularExpression(pattern: "^exposdk:(\\d+\\.\\d+\\.\\d+)$", options: [])
    guard let match = regex.firstMatch(in: runtimeVersion, options: [], range: NSRange(runtimeVersion.startIndex..<runtimeVersion.endIndex, in: runtimeVersion)),
          let range = Range(match.range(at: 1), in: runtimeVersion) else {
      return nil
    }
    return String(runtimeVersion[range])
  }

  @objc public func launchAsset() -> Dictionary<String, Any> {
    return self.rawManifestJSON().requiredValue(forKey: "launchAsset")
  }

  @objc public func assets() -> [Dictionary<String, Any>] {
    return self.rawManifestJSON().requiredValue(forKey: "assets")
  }

  @objc public override func bundleUrl() -> String {
    return self.launchAsset().requiredValue(forKey: "url")
  }

  override func expoClientConfigRootObject() -> Dictionary<String, Any>? {
    return self.extra()?.optionalValue(forKey: "expoClient")
  }

  override func expoGoConfigRootObject() -> Dictionary<String, Any>? {
    return self.extra()?.optionalValue(forKey: "expoGo")
  }
}
