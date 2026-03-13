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

  @objc(availableSdkVersionForManifest:)
  public func availableSdkVersion(for manifest: Manifest?) -> String {
    guard let manifest = manifest,
          let manifestSdkVersion = manifest.expoGoSDKVersion() else {
      return ""
    }

    if manifestSdkVersion == sdkVersion {
      return sdkVersion
    }

    return ""
  }

  public func supportsVersion(_ sdkVersion: String) -> Bool {
    return self.sdkVersion == sdkVersion
  }

  @objc public var majorVersion: String {
    return Self.majorVersion(from: sdkVersion)
  }

  public static func majorVersion(from sdkVersion: String) -> String {
    return sdkVersion.components(separatedBy: ".").first ?? sdkVersion
  }

  public func isCompatible(sdkVersion: String?) -> Bool {
    guard let sdkVersion else { return false }
    return Self.majorVersion(from: sdkVersion) == majorVersion
  }
}
