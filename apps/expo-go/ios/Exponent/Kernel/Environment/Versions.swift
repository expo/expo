// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXManifests

@objc(EXVersions)
@objcMembers
public final class Versions: NSObject {

  public static let sharedInstance = Versions()

  public private(set) var sdkVersion: String

  private override init() {
    self.sdkVersion = BuildConstants.sharedInstance.sdkVersion ?? ""
    super.init()
  }

  private static let unversioned = "UNVERSIONED"
  private static let expoSDKRuntimeVersionPrefix = "exposdk:"

  @objc(availableSdkVersionForManifest:)
  public func availableSdkVersion(for manifest: Manifest?) -> String {
    guard let manifest = manifest,
          let manifestSdkVersion = manifest.expoGoSDKVersion() else {
      return ""
    }

    if supportsVersion(manifestSdkVersion) {
      return sdkVersion
    }

    return ""
  }

  public func supportsVersion(_ sdkVersion: String) -> Bool {
    return isCompatible(sdkVersion: sdkVersion)
  }

  @objc public var majorVersion: String {
    return Self.majorVersion(from: sdkVersion)
  }

  public static func majorVersion(from sdkVersion: String) -> String {
    let stripped = stripRuntimeVersionPrefix(sdkVersion)
    return stripped.components(separatedBy: ".").first ?? stripped
  }

  public func isCompatible(sdkVersion: String?) -> Bool {
    return Self.areCompatible(supportedSdkVersion: self.sdkVersion, sdkVersion: sdkVersion)
  }

  /// Whether a project's `sdkVersion` is compatible with the SDK version an Expo Go client
  /// supports (`supportedSdkVersion`). Two versions are compatible when they share a major
  /// version; `UNVERSIONED` is compatible with anything. Both arguments accept an optional
  /// `exposdk:` runtime-version prefix.
  ///
  /// Expo Go supports a single SDK major and projects always publish `X.0.0`, so the major
  /// version determines compatibility. The client's own version string is not guaranteed to
  /// equal the supported SDK version — a client patch release (e.g. `56.0.1` serving SDK
  /// `56.0.0`) bumps the former but not the latter — so comparing the full version string would
  /// reject every otherwise-loadable project.
  public static func areCompatible(supportedSdkVersion: String?, sdkVersion: String?) -> Bool {
    guard let supportedSdkVersion, let sdkVersion else {
      return false
    }
    let supported = stripRuntimeVersionPrefix(supportedSdkVersion)
    let candidate = stripRuntimeVersionPrefix(sdkVersion)
    if supported == unversioned || candidate == unversioned {
      return true
    }
    return majorVersion(from: supported) == majorVersion(from: candidate)
  }

  private static func stripRuntimeVersionPrefix(_ version: String) -> String {
    guard version.hasPrefix(expoSDKRuntimeVersionPrefix) else {
      return version
    }
    return String(version.dropFirst(expoSDKRuntimeVersionPrefix.count))
  }
}
