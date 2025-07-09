//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc(EXManifestsExpoUpdatesManifest)
@objcMembers
public class ExpoUpdatesManifest: Manifest {
  public func rawId() -> String {
    return rawManifestJSON().requiredValue(forKey: "id")
  }

  public override func stableLegacyId() -> String {
    return rawId()
  }

  public override func scopeKey() -> String {
    let extra: [String: Any] = rawManifestJSON().requiredValue(forKey: "extra")
    return extra.requiredValue(forKey: "scopeKey")
  }

  private func extra() -> [String: Any]? {
    return rawManifestJSON().optionalValue(forKey: "extra")
  }

  public override func easProjectId() -> String? {
    guard let easConfig: [String: Any] = extra()?.optionalValue(forKey: "eas") else {
      return nil
    }
    return easConfig.optionalValue(forKey: "projectId")
  }

  public func createdAt() -> String {
    return rawManifestJSON().requiredValue(forKey: "createdAt")
  }

  public func runtimeVersion() -> String {
    return rawManifestJSON().requiredValue(forKey: "runtimeVersion")
  }

  public override func expoGoSDKVersion() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "sdkVersion")
  }

  public func launchAsset() -> [String: Any] {
    return rawManifestJSON().requiredValue(forKey: "launchAsset")
  }

  public func assets() -> [[String: Any]]? {
    return rawManifestJSON().optionalValue(forKey: "assets")
  }

  public override func bundleUrl() -> String {
    return launchAsset().requiredValue(forKey: "url")
  }

  public override func expoClientConfigRootObject() -> [String: Any]? {
    return extra()?.optionalValue(forKey: "expoClient")
  }

  public override func expoGoConfigRootObject() -> [String: Any]? {
    return extra()?.optionalValue(forKey: "expoGo")
  }
}
