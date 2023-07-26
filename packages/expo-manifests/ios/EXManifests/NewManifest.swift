//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc(EXManifestsNewManifest)
@objcMembers
public class NewManifest: Manifest {
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

  private func getSDKVersionFromRuntimeVersion() -> String? {
    let runtimeVersion = runtimeVersion()
    if runtimeVersion == "exposdk:UNVERSIONED" {
      return "UNVERSIONED"
    }

    // The pattern is valid, so it'll never throw
    // swiftlint:disable:next force_try
    let regex = try! NSRegularExpression(pattern: "^exposdk:(\\d+\\.\\d+\\.\\d+)$", options: [])
    guard let match = regex.firstMatch(
      in: runtimeVersion,
      options: [],
      range: NSRange(runtimeVersion.startIndex..<runtimeVersion.endIndex, in: runtimeVersion)
    ),
    let range = Range(match.range(at: 1), in: runtimeVersion) else {
      return nil
    }
    return String(runtimeVersion[range])
  }

  public override func expoGoSDKVersion() -> String? {
    return expoClientConfigRootObject()?.optionalValue(forKey: "sdkVersion") ?? getSDKVersionFromRuntimeVersion()
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
